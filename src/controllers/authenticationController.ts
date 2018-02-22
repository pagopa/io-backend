/**
 *
 */

import * as express from "express";
import { ISessionStorage } from "../services/iSessionStorage";
import {
  extractUserFromRequest, SpidUser,
  toUser, User,
  validateSpidUser
} from "../types/user";

/**
 * This controller handles the call from the IDP after
 * a successful authentication. In the request headers there are all the
 * attributes sent from the IDP..
 */
export default class AuthenticationController {
  public readonly sessionStorage: ISessionStorage;
  public readonly samlCert: string;
  public readonly spidStrategy: SpidStrategy;

  constructor(sessionStorage: ISessionStorage, samlCert: string, spidStrategy: SpidStrategy) {
    this.sessionStorage = sessionStorage;
    this.samlCert = samlCert;
    this.spidStrategy = spidStrategy;
  }

  /**
   * The Assertion consumer service.
   *
   * @param userPayload
   * @param res
   */
  public acs(userPayload: any, res: express.Response): void {
    const maybeUser = validateSpidUser(userPayload);

    maybeUser.fold(
      (error: string) => {
        res.status(500).json({
          message: error
        });
      },
      (spidUser: SpidUser) => {
        const user = toUser(spidUser);

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
   *
   * @param req
   * @param res
   */
  public logout(req: express.Request, res: express.Response): void {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      (error: string) => {
        res.status(500).json({
          message: error
        });
      },
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
   *
   * @param res
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
}
