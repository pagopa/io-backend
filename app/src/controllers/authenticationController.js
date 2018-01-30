// @flow

"use strict";

import type { SpidUser, User } from "../types/user";
import {
  extractUserFromRequest,
  extractUserFromSpid,
  toUser
} from "../types/user";
import type { SessionStorageInterface } from "../services/sessionStorageInterface";
import spidStrategy from "../strategies/spidStrategy";

/**
 * This controller handles the call from the IDP after
 * a successful authentication. In the request headers there are all the
 * attributes sent from the IDP.
 */
export default class AuthenticationController {
  sessionStorage: SessionStorageInterface;
  samlCert: string;
  spidStrategy: spidStrategy;

  /**
   * Class constructor.
   *
   * @param sessionStorage
   * @param samlCert
   * @param spidStrategy
   */
  constructor(
    sessionStorage: SessionStorageInterface,
    samlCert: string,
    spidStrategy: spidStrategy
  ) {
    this.sessionStorage = sessionStorage;
    this.samlCert = samlCert;
    this.spidStrategy = spidStrategy;
  }

  /**
   * The Assertion consumer service.
   *
   * @param req
   * @param res
   */
  acs(req: express$Request, res: express$Response) {
    const maybeUser = extractUserFromSpid(req);

    maybeUser.fold(
      (error: String) => {
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
   * The Single logout service.
   * The metadata for this Service Provider.
   *
   * @param req
   * @param res
   */
  slo(req: express$Request, res: express$Response) {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      (error: String) => {
        res.status(500).json({
          message: error
        });
      },
      (user: User) => {
        //delete Redis token
        this.sessionStorage.del(user.token);

        //logout from SPID
        //req.query = {};
        //req.query.entityID = user.spid_idp; //TODO: capire se riconosce l'idp o bisogna impostarlo (provare con idp non di test)

        spidStrategy.logout(req, function(err, request) {
          if (!err) {
            console.log(request);

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
   * The metadata for this Service Provider.
   *
   * @param req
   * @param res
   */
  metadata(req: express$Request, res: express$Response) {
    const metadata = this.spidStrategy.generateServiceProviderMetadata(
      this.samlCert
    );

    res
      .status(200)
      .set("Content-Type", "application/xml")
      .send(metadata);
  }
}
