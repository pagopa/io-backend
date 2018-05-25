/**
 * This controller handles the call from the IDP after a successful
 * authentication. In the request headers there are all the attributes sent from
 * the IDP.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import { isNone, none, Option, some } from "fp-ts/lib/Option";
import { ISessionStorage } from "../services/ISessionStorage";
import TokenService from "../services/tokenService";
import { SpidLevel } from "../types/spidLevel";
import {
  extractUserFromRequest,
  toAppUser,
  validateSpidUser
} from "../types/user";
import {
  IResponseErrorFatal,
  IResponseRedirect,
  IResponseSuccessJson,
  IResponseSuccessXml,
  ResponseErrorFatal,
  ResponseRedirect,
  ResponseSuccessJson,
  ResponseSuccessXml
} from "../utils/response";

export interface IPublicSession {
  readonly expired: boolean;
  readonly expireAt?: number;
  readonly newToken?: string;
  readonly spidLevel: SpidLevel;
}

export default class AuthenticationController {
  constructor(
    private readonly sessionStorage: ISessionStorage,
    private readonly samlCert: string,
    private readonly spidStrategy: SpidStrategy,
    private readonly tokenService: TokenService,
    private readonly getClientProfileRedirectionUrl: (token: string) => string
  ) {}

  /**
   * The Assertion consumer service.
   */
  public async acs(
    // tslint:disable-next-line:no-any
    userPayload: any
  ): Promise<IResponseErrorFatal | IResponseRedirect> {
    const errorOrUser = validateSpidUser(userPayload);

    if (isLeft(errorOrUser)) {
      const error = errorOrUser.value;
      return ResponseErrorFatal(error.message);
    }

    const spidUser = errorOrUser.value;
    const user = toAppUser(spidUser, this.tokenService.getNewToken());

    const timestamp = Date.now();
    const errorOrResponse = await this.sessionStorage.set(
      user.token,
      user,
      timestamp
    );

    if (isLeft(errorOrResponse)) {
      const error = errorOrResponse.value;
      return ResponseErrorFatal(error.message);
    }
    const response = errorOrResponse.value;

    if (!response) {
      return ResponseErrorFatal("Error creating the user session");
    }
    const urlWithToken = this.getClientProfileRedirectionUrl(user.token);

    return ResponseRedirect(urlWithToken);
  }

  /**
   * Retrieves the logout url from the IDP.
   */
  public async logout(
    req: express.Request
  ): Promise<IResponseErrorFatal | IResponseRedirect> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      const error = errorOrUser.value;
      return ResponseErrorFatal(error.message);
    }

    const user = errorOrUser.value;

    const errorOrResponse = await this.sessionStorage.del(user.token);

    if (isLeft(errorOrResponse)) {
      const error = errorOrResponse.value;
      return ResponseErrorFatal(error.message);
    }

    const response = errorOrResponse.value;

    if (!response) {
      return ResponseErrorFatal("Error creating the user session");
    }

    // Logout from SPID.
    // The logout function in spid-passport expects an entityID attribute
    // passed in the query string. Here we recover the IDP chosen for the
    // login (and stored in the User object) to forge a request suitable
    // for the login function.
    req.query = {};
    req.query.entityID = user.spid_idp;

    return this.spidLogout(req);
  }

  /**
   * Returns data about the current user session.
   */
  public async getSessionState(
    req: express.Request
  ): Promise<IResponseErrorFatal | IResponseSuccessJson<IPublicSession>> {
    const maybeToken = await this.extractTokenFromRequest(req);
    if (isNone(maybeToken)) {
      return ResponseErrorFatal("No token in the request");
    }

    const token = maybeToken.value;
    const errorOrSession = await this.sessionStorage.get(token);
    if (isLeft(errorOrSession)) {
      // Previous token not found or expired, try to refresh.
      const errorOrSessionState = await this.sessionStorage.refresh(token);

      if (isLeft(errorOrSessionState)) {
        // Unable to refresh token or session not found.
        const error = errorOrSessionState.value;
        return ResponseErrorFatal(error.message);
      }

      // Return the new session information.
      const sessionState = errorOrSessionState.value;
      return ResponseSuccessJson({
        expired: sessionState.expired,
        newToken: sessionState.newToken,
        spidLevel: sessionState.user.spid_level
      });
    }

    // The session contains the user, remove it before return.
    const session = errorOrSession.value;
    const publicSession = {
      expireAt: session.expireAt,
      expired: session.expired,
      spidLevel: session.user.spid_level
    };

    // Return the actual session information.
    return ResponseSuccessJson(publicSession);
  }

  /**
   * The Single logout service.
   */
  public async slo(): Promise<IResponseRedirect> {
    return ResponseRedirect("/");
  }

  /**
   * The metadata for this Service Provider.
   */
  public async metadata(): Promise<IResponseSuccessXml<string>> {
    const metadata = this.spidStrategy.generateServiceProviderMetadata(
      this.samlCert
    );

    return ResponseSuccessXml(metadata);
  }

  /**
   * Wrap the spidStrategy.logout function in a new Promise.
   */
  private spidLogout(
    req: express.Request
  ): Promise<IResponseErrorFatal | IResponseRedirect> {
    return new Promise(resolve => {
      this.spidStrategy.logout(req, (err, logoutUrl) => {
        if (!err) {
          return resolve(ResponseRedirect(logoutUrl));
        } else {
          return resolve(ResponseErrorFatal(err.message));
        }
      });
    });
  }

  /**
   * Extracts the Bearer token from the authorization header in the request.
   */
  private extractTokenFromRequest(
    req: express.Request
  ): Promise<Option<string>> {
    return new Promise(resolve => {
      if (
        req.headers &&
        req.headers.authorization &&
        typeof req.headers.authorization === "string"
      ) {
        const authorization = req.headers.authorization;
        const parts = authorization.split(" ");
        if (parts.length === 2) {
          const scheme = parts[0];
          const token = parts[1];

          if (/^Bearer$/i.test(scheme)) {
            resolve(some(token));
          } else {
            resolve(none);
          }
        }
      }
      resolve(none);
    });
  }
}
