// @flow

"use strict";

import type { SpidUser } from "../types/user";
import type { SessionStorageInterface } from "../services/sessionStorageInterface";
import { extractUserFromSpid, toUser } from "../types/user";
import spidStrategy from "../strategies/spidStrategy";
const fs = require("fs");

/**
 * This controller handles the call from the IDP after
 * a successful authentication. In the request headers there are all the
 * attributes sent from the IDP.
 */
export default class AuthenticationController {
  sessionStorage: SessionStorageInterface;

  /**
   * Class constructor.
   *
   * @param sessionStorage
   */
  constructor(sessionStorage: SessionStorageInterface) {
    this.sessionStorage = sessionStorage;
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
   * The metadata for this Service Provider.
   *
   * @param req
   * @param res
   */
  metadata(req: express$Request, res: express$Response) {
    const certPath = process.env.HTTPS_CERT_PATH || "./certs/cert.pem";
    // winston.log("info", "Reading HTTPS certificate file from %s", certPath);
    const metadata = spidStrategy.generateServiceProviderMetadata(
      fs.readFileSync(certPath, "utf-8")
    );

    res
      .status(200)
      .set("Content-Type", "application/xml")
      .send(metadata);
  }
}
