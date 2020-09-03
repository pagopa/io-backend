/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { MyPortalToken, SessionToken, WalletToken } from "../types/token";
import { User, UserWithMyPortalToken } from "../types/user";

export interface ISessionStorage {
  /**
   * Stores a value to the cache.
   */
  readonly set: (
    user: UserWithMyPortalToken,
    expireSec?: number
  ) => Promise<Either<Error, boolean>>;

  /**
   * Retrieves a value from the cache using the session token.
   */
  readonly getBySessionToken: (
    token: SessionToken
  ) => Promise<Either<Error, Option<User>>>;

  /**
   * Retrieves a value from the cache using the wallet token.
   */
  readonly getByWalletToken: (
    token: WalletToken
  ) => Promise<Either<Error, Option<User>>>;

  /**
   * Removes a value from the cache.
   */
  readonly del: (
    sessionToken: SessionToken,
    walletToken: WalletToken,
    myPortalToken?: MyPortalToken
  ) => Promise<Either<Error, boolean>>;

  readonly isBlockedUser: (
    fiscalCode: FiscalCode
  ) => Promise<Either<Error, boolean>>;

  readonly getSessionTtl: (
    token: SessionToken
  ) => Promise<Either<Error, number>>;
}
