/**
 * This controller handles the call from the IDP after a successful
 * authentication. In the request headers there are all the attributes sent from
 * the IDP.
 */

import * as express from "express";
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

  private return500Error(error: Error, res: express.Response): void {
    res.status(500).json({
      message: error.message
    });
  }
}
