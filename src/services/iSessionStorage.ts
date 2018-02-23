/**
 *
 */

import { Either } from "fp-ts/lib/Either";
import { User } from "../types/user";

export interface ISessionStorage {
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
  get(token: string): Promise<Either<string, User>>;

  /**
   * Removes a value from the cache.
   *
   * @param token
   */
  del(token: string): void;
}
