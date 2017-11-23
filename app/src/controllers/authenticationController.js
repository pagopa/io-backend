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
      spid_idp: req.headers["shib-identity-provider"]
    };

    [
      "name",
      "familyname",
      "fiscalnumber",
      "spidcode",
      "gender",
      "mobilephone",
      "email",
      "address",
      "expirationdate",
      "digitaladdress",
      "countyofbirth",
      "dateofbirth",
      "idcard",
      "placeofbirth"
    ].forEach(field => {
      user[field] = req.headers["spid-attribute-" + field];
    });

    this.sessionStorage.set(token, user);

    res.redirect("/profile.html?token=" + token);
  }
}
