/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import { SessionToken, WalletToken } from "../types/token";
import { User } from "../types/user";

export interface ISessionStorage {
  /**
   * Stores a value to the cache.
   */
  set(user: User): Promise<Either<Error, boolean>>;

  /**
   * Retrieves a value from the cache.
   */
  get(token: SessionToken): Promise<Either<Error, User>>;

  /**
   * Removes a value from the cache.
   */
  del(
    sessionToken: SessionToken,
    walletToken: WalletToken
  ): Promise<Either<Error, boolean>>;
}
