/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import { User } from "../types/user";
import { ISessionState } from "./redisSessionStorage";

export interface ISessionStorage {
  /**
   * Stores a value to the cache.
   */
  set(token: string, user: User): Promise<Either<Error, boolean>>;

  /**
   * Retrieves a value from the cache.
   */
  get(token: string): Promise<Either<Error, ISessionState>>;

  /**
   * Refresh an existing token.
   */
  refresh(token: string): Promise<Either<Error, ISessionState>>;

  /**
   * Removes a value from the cache.
   */
  del(token: string): Promise<Either<Error, boolean>>;
}
