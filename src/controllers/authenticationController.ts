/**
 * This controller handles the call from the IDP after a successful
 * authentication. In the request headers there are all the attributes sent from
 * the IDP.
 */

import * as express from "express";
import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { isNone, none, Option, some } from "fp-ts/lib/Option";
import { ISessionStorage } from "../services/iSessionStorage";
import { ISessionState } from "../services/redisSessionStorage";
import TokenService from "../services/tokenService";
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
    private readonly tokenService: TokenService
  ) {}

  /**
   * The Assertion consumer service.
   */
  // tslint:disable-next-line:no-any
  public async acs(userPayload: any): Promise<Either<Error, string>> {
    const errorOrUser = validateSpidUser(userPayload);

    if (isLeft(errorOrUser)) {
      const error = errorOrUser.value;
      return left(error);
    }

    const spidUser = errorOrUser.value;
    const user = toAppUser(spidUser, this.tokenService.getNewToken());

    const errorOrBool = await this.sessionStorage.set(user.token, user);

    if (isLeft(errorOrBool)) {
      const error = errorOrBool.value;
      return left(error);
    }
    const response = errorOrBool.value;

    if (!response) {
      return left(new Error("Error creating the user session"));
    }
    const url =
      process.env.CLIENT_REDIRECTION_URL || "/profile.html?token={token}";
    const urlWithToken = url.replace("{token}", user.token);

    return right(urlWithToken);
  }

  /**
   * Retrieves the logout url from the IDP.
   */
  public async logout(req: express.Request): Promise<Either<Error, string>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      const error = errorOrUser.value;
      return left(error);
    }

    const user = errorOrUser.value;

    const errorOrBool = await this.sessionStorage.del(user.token);

    if (isLeft(errorOrBool)) {
      const error = errorOrBool.value;
      return left(error);
    }

    const response = errorOrBool.value;

    if (!response) {
      return left(new Error("Error creating the user session"));
    }

    // Logout from SPID.
    req.query = {};
    req.query.entityID = user.spid_idp;

    return await this.spidLogout(req);
  }

  /**
   * Returns data about the current user session.
   */
  public async getSessionState(
    req: express.Request
  ): Promise<Either<Error, string>> {
    const maybeToken = await this.extractTokenFromRequest(req);
    if (isNone(maybeToken)) {
      return left(new Error("No token in the request"));
    }

    const token = maybeToken.value;
    const errorOrSession = await this.sessionStorage.get(token);
    if (isLeft(errorOrSession)) {
      // Previous token not found or expired, try to refresh.
      const errorOrSessionState = await this.refreshUserToken(token);

      if (isLeft(errorOrSessionState)) {
        // Unable to refresh token or session not found.
        const error = errorOrSessionState.value;
        return left(error);
      }

      // Return the new session information.
      const sessionState = errorOrSessionState.value;
      return right(JSON.stringify(sessionState));
    }

    // The session contains the user, remove it before return.
    const session = errorOrSession.value;
    const publicSession = {
      expireAt: session.expireAt,
      expired: session.expired
    };

    // Return the actual session information.
    return right(JSON.stringify(publicSession));
  }

  /**
   * The Single logout service.
   */
  public async slo(): Promise<Either<Error, string>> {
    return right("/");
  }

  /**
   * The metadata for this Service Provider.
   */
  public metadata(res: express.Response): void {
    const metadata = this.spidStrategy.generateServiceProviderMetadata(
      this.samlCert
    );

    res
      .status(200)
      .set("Content-Type", "application/xml")
      .send(metadata);
  }

  /**
   * Wrap the spidStrategy.logout function in a new Promise.
   */
  private spidLogout(req: express.Request): Promise<Either<Error, string>> {
    return new Promise(resolve => {
      this.spidStrategy.logout(req, (err, request: express.Request) => {
        if (!err) {
          return resolve(
            right<Error, string>(
              JSON.stringify({
                logoutUrl: request
              })
            )
          );
        } else {
          return resolve(left<Error, string>(err));
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

  /**
   * Refresh a user token in the session storage and returns the new token.
   */
  private async refreshUserToken(
    token: string
  ): Promise<Either<Error, ISessionState>> {
    return await this.sessionStorage.refresh(token);
  }
}
