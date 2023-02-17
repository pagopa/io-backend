/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { EmailString, FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";
import { AssertionRef } from "../../generated/lollipop-api/AssertionRef";
import {
  BPDToken,
  FIMSToken,
  MyPortalToken,
  SessionToken,
  WalletToken,
  ZendeskToken
} from "../types/token";
import { User, UserV5 } from "../types/user";

export interface ISessionStorage {
  /**
   * Stores a value to the cache.
   */
  readonly set: (
    user: UserV5,
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
   * Retrieves a value from the cache using the myportal token.
   */
  readonly getByMyPortalToken: (
    token: MyPortalToken
  ) => Promise<Either<Error, Option<User>>>;

  /**
   * Retrieves a value from the cache using the bpd token.
   */
  readonly getByBPDToken: (
    token: BPDToken
  ) => Promise<Either<Error, Option<User>>>;

  /**
   * Retrieves a value from the cache using the zendesk token.
   */
  readonly getByZendeskToken: (
    token: ZendeskToken
  ) => Promise<Either<Error, Option<User>>>;

  /**
   * Retrieves a value from the cache using the FIMS token.
   */
  readonly getByFIMSToken: (
    token: FIMSToken
  ) => Promise<Either<Error, Option<User>>>;

  /**
   * Retrieve the LolliPoP assertionRef related to an user
   *
   * @param user The AppUser value used to get the related fiscalCode
   */
  readonly getLollipopAssertionRefForUser: (
    user: UserV5
  ) => Promise<Either<Error, AssertionRef>>;

  /**
   * Upsert the LolliPoP assertionRef related to an user
   *
   * @param user The AppUser value used to get the related fiscalCode
   * @param assertionRef The identifier for the pubkey
   * @param expireAssertionRefSec The ttl for the key, default value is configured in RedisSessionStorage instance
   */
  readonly setLollipopAssertionRefForUser: (
    user: UserV5,
    assertionRef: AssertionRef,
    expireAssertionRefSec?: Second
  ) => Promise<Either<Error, boolean>>;

  /**
   * Delete the Lollipop assertionRef related to an user
   *
   * @param user The AppUser value used to get the related fiscalCode
   */
  readonly delLollipopAssertionRefForUser: (
    user: UserV5
  ) => Promise<Either<Error, boolean>>;

  /**
   * Removes a value from the cache.
   */
  readonly del: (user: User) => Promise<Either<Error, boolean>>;

  readonly isBlockedUser: (
    fiscalCode: FiscalCode
  ) => Promise<Either<Error, boolean>>;

  readonly update: (updatedUser: UserV5) => Promise<Either<Error, boolean>>;

  readonly setPagoPaNoticeEmail: (
    user: User,
    NoticeEmail: EmailString
  ) => Promise<Either<Error, boolean>>;

  readonly delPagoPaNoticeEmail: (user: User) => Promise<Either<Error, true>>;

  readonly getPagoPaNoticeEmail: (
    user: User
  ) => Promise<Either<Error, EmailString>>;
}
