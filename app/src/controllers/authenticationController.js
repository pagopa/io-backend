// @flow

"use strict";

import type { User } from "../types/user";
import type { SessionStorageInterface } from "../services/sessionStorageInterface";

/**
 *
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
   *
   * @param req
   * @param res
   */
  sso(req: express$Request, res: express$Response) {
    // Use the shibboleth session id as token.
    const token = req.headers["shib-session-id"];

    const user: User = {
      created_at: new Date().getTime(),
      token: token,
      spid_idp: req.headers["shib-identity-provider"],
      address: req.headers["spid-attribute-address"],
      countyofbirth: req.headers["spid-attribute-countyofbirth"],
      dateofbirth: req.headers["spid-attribute-dateofbirth"],
      digitaladdress: req.headers["spid-attribute-digitaladdress"],
      email: req.headers["spid-attribute-email"],
      expirationdate: req.headers["spid-attribute-expirationdate"],
      familyname: req.headers["spid-attribute-familyname"],
      fiscal_code: req.headers["spid-attribute-fiscalnumber"],
      gender: req.headers["spid-attribute-gender"],
      idcard: req.headers["spid-attribute-idcard"],
      mobilephone: req.headers["spid-attribute-mobilephone"],
      name: req.headers["spid-attribute-name"],
      placeofbirth: req.headers["spid-attribute-placeofbirth"],
      spidcode: req.headers["spid-attribute-spidcode"]
    };

    this.sessionStorage.set(token, user);

    const url =
      process.env.CLIENT_REDIRECTION_URL || "/profile.html?token={token}";
    const urlWithToken = url.replace("{token}", token);

    res.redirect(urlWithToken);
  }
}
