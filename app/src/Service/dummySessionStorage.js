// @flow

"use strict";

import type { User } from "../user";
import type { SessionStorageInterface } from "./SessionStorageInterface";

export default class DummySessionStorage implements SessionStorageInterface {
  // Dummy, in memory storage
  tokens: Object;

  /**
   *
   */
  constructor() {
    this.tokens = {};
  }

  /**
   * {@inheritDoc}
   */
  set(token: string, user: User): void {
    this.tokens[token] = user;
  }

  /**
   * {@inheritDoc}
   */
  get(token: string): User {
    return this.tokens[token];
  }
}
