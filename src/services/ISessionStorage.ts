/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { EmailString, FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";
import * as O from "fp-ts/lib/Option";
import { AssertionRef as BackendAssertionRef } from "../../generated/backend/AssertionRef";
import {
  BPDToken,
  FIMSToken,
  MyPortalToken,
  SessionToken,
  WalletToken,
  ZendeskToken,
} from "../types/token";
import { User, UserV5 } from "../types/user";
import { LollipopData } from "../types/assertionRef";

export interface ISessionStorage {
  /**
   * Stores or updated a value to the cache.
   *
   * @param user the user to store or update
   * @param expireSec the ttl of all the session-related tokens
   * @param isUserSessionUpdate a boolean that defines if we are updating an existing session or creating a new one
   * @returns a promise of either an error or boolena
   */
  readonly set: (
    user: UserV5,
    expireSec?: number,
    isUserSessionUpdate?: boolean
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
   * @deprecated
   * @param fiscalCode The fiscalCode value used to get the related assertionRef
   */
  readonly getLollipopAssertionRefForUser: (
    fiscalCode: FiscalCode
  ) => Promise<Either<Error, O.Option<BackendAssertionRef>>>;

  /**
   * Retrieve all the LolliPoP-related data for an user
   *
   * @param fiscalCode The fiscalCode value used to get the related assertionRef
   */
  readonly getLollipopDataForUser: (
    fiscalCode: FiscalCode
  ) => Promise<Either<Error, O.Option<LollipopData>>>;

  /**
   * Upsert the LolliPoP assertionRef related to an user
   *
   * @param user The AppUser value used to get the related fiscalCode
   * @param data The LollipopData, containing the identifier for the pubkey and the login type
   * @param expireAssertionRefSec The ttl for the key, default value is configured in RedisSessionStorage instance
   */
  readonly setLollipopDataForUser: (
    user: UserV5,
    data: LollipopData,
    expireAssertionRefSec?: Second
  ) => Promise<Either<Error, boolean>>;

  /**
   *  @deprecated
   *  Upsert the LolliPoP assertionRef related to an user
   *
   * @param user The AppUser value used to get the related fiscalCode
   * @param assertionRef The identifier for the pubkey
   * @param expireAssertionRefSec The ttl for the key, default value is configured in RedisSessionStorage instance
   */
  readonly setLollipopAssertionRefForUser: (
    user: UserV5,
    assertionRef: BackendAssertionRef,
    expireAssertionRefSec?: Second
  ) => Promise<Either<Error, boolean>>;

  /**
   * Delete the Lollipop assertionRef related to an user
   *
   * @param fiscalCode A user fiscal code
   */
  readonly delLollipopDataForUser: (
    fiscalCode: FiscalCode
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
