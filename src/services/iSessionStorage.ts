/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import { User } from "../types/user";

export interface ISessionStorage {
  /**
   * Stores a value to the cache.
   */
  set(token: string, user: User): void;

  /**
   * Retrieves a value from the cache.
   */
  get(token: string): Promise<Either<Error, User>>;

  /**
   * Refresh an existing token.
   */
  refresh(token: string): Promise<Either<Error, string>>;

  /**
   * Removes a value from the cache.
   */
  del(token: string): void;
}
