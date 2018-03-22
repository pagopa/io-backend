/**
 * This controller handles the call from the IDP after a successful
 * authentication. In the request headers there are all the attributes sent from
 * the IDP.
 */

import * as express from "express";
import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { isNone, none, Option, some } from "fp-ts/lib/Option";
import * as winston from "winston";
import { ISessionStorage } from "../services/iSessionStorage";
import TokenService from "../services/tokenService";
import {
  extractUserFromRequest,
  SpidUser,
  toAppUser,
  User,
  validateSpidUser
} from "../types/user";

export interface IsessionState {
  readonly expired: boolean;
  readonly newToken?: string;
}

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
  public acs(userPayload: any, res: express.Response): void {
    winston.log(
      "info",
      "Called assertion consumer service with data:",
      userPayload
    );

    const errorOrUser = validateSpidUser(userPayload);

    errorOrUser.fold(
      (error: Error) => this.return500Error(error, res),
      (spidUser: SpidUser) => {
        const user = toAppUser(spidUser, this.tokenService.getNewToken());

        this.sessionStorage.set(user.token, user);

        const url =
          process.env.CLIENT_REDIRECTION_URL || "/profile.html?token={token}";
        const urlWithToken = url.replace("{token}", user.token);

        res.redirect(urlWithToken);
      }
    );
  }

  /**
   * Retrieves the logout url from the IDP.
   */
  public logout(req: express.Request, res: express.Response): void {
    const errorOrUser = extractUserFromRequest(req);

    errorOrUser.fold(
      (error: Error) => this.return500Error(error, res),
      (user: User) => {
        // Delete the Redis token.
        this.sessionStorage.del(user.token);

        // Logout from SPID.
        req.query = {};
        req.query.entityID = user.spid_idp;

        this.spidStrategy.logout(req, (err, request: express.Request) => {
          if (!err) {
            res.status(200).json({
              logoutUrl: request
            });
          } else {
            res.status(500).json({
              message: err.toString()
            });
          }
        });
      }
    );
  }

  /**
   * The Single logout service.
   */
  public slo(res: express.Response): void {
    res.redirect("/");
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
   * Returns data about the current user session.
   */
  public async getSessionState(
    req: express.Request
  ): Promise<Either<Error, IsessionState>> {
    try {
      const maybeToken = await this.extractTokenFromRequest(req);
      if (isNone(maybeToken)) {
        return left(new Error("No token in the request"));
      }

      const errorOrSession = await this.sessionStorage.get(maybeToken.value);
      if (isLeft(errorOrSession)) {
        const errorOrNewToken = await this.refreshUserToken(maybeToken.value);
        if (isLeft(errorOrNewToken)) {
          const error = errorOrNewToken.value;
          return left(error);
        }
        const newToken = errorOrNewToken.value;
        return right({ expired: true, newToken });
      }
      return right({ expired: false });
    } catch (err) {
      return left(new Error("Error while loading the session"));
    }
  }

  /**
   *
   */
  private async extractTokenFromRequest(
    req: express.Request
  ): Promise<Option<string>> {
    if (req.headers && req.headers.authorization) {
      const authorization = req.headers.authorization as string;
      const parts = authorization.split(" ");
      if (parts.length === 2) {
        const scheme = parts[0];
        const token = parts[1];

        if (/^Bearer$/i.test(scheme)) {
          return some(token);
        } else {
          return none;
        }
      }
    }
    return none;
  }

  /**
   *
   */
  private async refreshUserToken(
    token: string
  ): Promise<Either<Error, string>> {
    try {
      return await this.sessionStorage.refresh(token);
    } catch (err) {
      return left(new Error("Error while refreshing the token"));
    }
  }

  private return500Error(error: Error, res: express.Response): void {
    res.status(500).json({
      message: error.message
    });
  }
}
