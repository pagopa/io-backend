// @flow

"use strict";

import type { User } from "../types/user";
import type { SessionStorageInterface } from "../services/sessionStorageInterface";

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
    const reqWithUser = ((req: Object): { user: Object });

    // Use the SAML sessionIndex as token.
    const token = reqWithUser.user.sessionIndex;

    const user: User = {
      created_at: new Date().getTime(),
      token: token,
      sessionIndex: token, // The sessionIndex is needed for logout.
      spid_idp: reqWithUser.user.issuer._, // The used idp is needed for logout.
      fiscal_code: reqWithUser.user.fiscalNumber,
      name: reqWithUser.user.name,
      familyname: reqWithUser.user.familyName
    };

    this.sessionStorage.set(token, user);

    const url =
      process.env.CLIENT_REDIRECTION_URL || "/profile.html?token={token}";
    const urlWithToken = url.replace("{token}", token);

    res.redirect(urlWithToken);
  }
}
