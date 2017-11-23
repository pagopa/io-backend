// @flow

"use strict";

import type { User } from "../user";

/**
 *
 */
export default class PreferencesController {
  /**
   *
   * @param req
   * @param res
   */
  preferences(req: express$Request, res: express$Response) {
    const reqWithUser = ((req: Object): { user: User });
    res.json(reqWithUser.user);
  }
}
