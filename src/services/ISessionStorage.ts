/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { EmailString, FiscalCode } from "@pagopa/ts-commons/lib/strings";
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
