/**
 * This controller handles the call from the IDP after a successful
 * authentication. In the request headers there are all the attributes sent from
 * the IDP.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import { isNone, none, Option, some } from "fp-ts/lib/Option";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponsePermanentRedirect,
  IResponseSuccessJson,
  IResponseSuccessXml,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponsePermanentRedirect,
  ResponseSuccessJson,
  ResponseSuccessXml
} from "italia-ts-commons/lib/responses";
import { UrlFromString } from "italia-ts-commons/lib/url";
import {
  ISessionStorage,
  SessionToken,
  WalletToken
} from "../services/ISessionStorage";
import TokenService from "../services/tokenService";
import { PublicSession } from "../types/api/PublicSession";
import {
  extractUserFromRequest,
  toAppUser,
  validateSpidUser
} from "../types/user";

export default class AuthenticationController {
  constructor(
    private readonly sessionStorage: ISessionStorage,
    private readonly samlCert: string,
    private readonly spidStrategy: SpidStrategy,
    private readonly tokenService: TokenService,
    private readonly getClientProfileRedirectionUrl: (
      token: string
    ) => UrlFromString
  ) {}

  /**
   * The Assertion consumer service.
   */
  public async acs(
    // tslint:disable-next-line:no-any
    userPayload: any
  ): Promise<IResponseErrorInternal | IResponsePermanentRedirect> {
    const errorOrUser = validateSpidUser(userPayload);

    if (isLeft(errorOrUser)) {
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    const spidUser = errorOrUser.value;
    const sessionToken = this.tokenService.getNewToken();
    const walletToken = this.tokenService.getNewToken();
    const user = toAppUser(spidUser, sessionToken, walletToken);
    const timestamp = Date.now();

    const errorOrResponse = await this.sessionStorage.set(user, timestamp);

    if (isLeft(errorOrResponse)) {
      const error = errorOrResponse.value;
      return ResponseErrorInternal(error.message);
    }
    const response = errorOrResponse.value;

    if (!response) {
      return ResponseErrorInternal("Error creating the user session");
    }
    const urlWithToken = this.getClientProfileRedirectionUrl(
      user.session_token
    );

    return ResponsePermanentRedirect(urlWithToken);
  }

  /**
   * Retrieves the logout url from the IDP.
   */
  public async logout(
    req: express.Request
  ): Promise<IResponseErrorInternal | IResponsePermanentRedirect> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    const user = errorOrUser.value;

    const errorOrResponse = await this.sessionStorage.del(
      user.session_token as SessionToken,
      user.wallet_token as WalletToken
    );

    if (isLeft(errorOrResponse)) {
      const error = errorOrResponse.value;
      return ResponseErrorInternal(error.message);
    }

    const response = errorOrResponse.value;

    if (!response) {
      return ResponseErrorInternal("Error creating the user session");
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
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PublicSession>
  > {
    // This controller doesn't have a Passport middleware that checks the Bearer token, we need to check it here.
    const maybeToken = await this.extractTokenFromRequest(req);
    if (isNone(maybeToken)) {
      return ResponseErrorInternal("No token in the request");
    }

    // The token is present, look for a session.
    const sessionToken = maybeToken.value;
    const errorOrSession = await this.sessionStorage.get(
      sessionToken as SessionToken
    );
    if (isLeft(errorOrSession)) {
      // Previous token not found.
      return ResponseErrorNotFound("Session not found", "");
    }

    const session = errorOrSession.value;

    // Check if the session is expired, in that case we need to refresh the tokens.
    if (session.expireAt.getTime() < Date.now()) {
      const newSessionToken = this.tokenService.getNewToken();
      const newWalletToken = this.tokenService.getNewToken();
      const errorOrRefreshedSession = await this.sessionStorage.refresh(
        session.user.session_token as SessionToken,
        session.user.wallet_token as WalletToken,
        newSessionToken as SessionToken,
        newWalletToken as WalletToken
      );

      if (isLeft(errorOrRefreshedSession)) {
        // Unable to refresh token or session not found.
        const error = errorOrRefreshedSession.value;
        return ResponseErrorInternal(error.message);
      }

      // Return the new session information.
      const refreshedSession = errorOrRefreshedSession.value;
      return ResponseSuccessJson({
        expireAt: new Date(refreshedSession.expireAt),
        newToken: refreshedSession.newToken,
        spidLevel: refreshedSession.user.spid_level,
        walletToken: refreshedSession.user.wallet_token
      });
    }

    // Return the actual session information.
    return ResponseSuccessJson({
      expireAt: new Date(session.expireAt),
      spidLevel: session.user.spid_level,
      walletToken: session.user.wallet_token
    });
  }

  /**
   * The Single logout service.
   */
  public async slo(): Promise<IResponsePermanentRedirect> {
    const url: UrlFromString = {
      href: "/"
    };

    return ResponsePermanentRedirect(url);
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
  ): Promise<IResponseErrorInternal | IResponsePermanentRedirect> {
    return new Promise(resolve => {
      this.spidStrategy.logout(req, (err, logoutUrl) => {
        if (!err) {
          const url: UrlFromString = {
            href: logoutUrl
          };

          return resolve(ResponsePermanentRedirect(url));
        } else {
          return resolve(ResponseErrorInternal(err.message));
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
