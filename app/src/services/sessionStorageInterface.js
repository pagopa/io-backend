// @flow

"use strict";

import type { User } from "../types/user";

export interface SessionStorageInterface {
  /**
   *
   * @param token
   * @param user
   */
  set(token: string, user: User): void;

  /**
   *
   * @param token
   * @returns {*}
   */
  get(token: string): User;
}
