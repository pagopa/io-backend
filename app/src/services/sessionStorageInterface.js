// @flow

"use strict";

import type { User } from "../types/user";

export interface SessionStorageInterface {
  /**
   * Stores a value to the cache.
   *
   * @param token
   * @param user
   */
  set(token: string, user: User): void;

  /**
   * Retrieves a value from the cache.
   *
   * @param token
   * @returns {*}
   */
  get(token: string): Promise<User>;
}
