/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { AssertionRef as BackendAssertionRef } from "../../generated/backend/AssertionRef";
import { MyPortalToken, SessionToken, WalletToken } from "../types/token";
import { User } from "../types/user";
import { LollipopData } from "../types/assertionRef";
import { ActiveSessionInfo } from "../utils/fastLogin";

export interface ISessionStorage {
  /**
   * Retrieves a value from the cache using the session token.
   */
  readonly getBySessionToken: (
    token: SessionToken
  ) => Promise<Either<Error, Option<User>>>;

  /**
   * Retrieves a value from the cache using the myportal token.
   */
  readonly getByMyPortalToken: (
    token: MyPortalToken
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

  readonly delPagoPaNoticeEmail: (user: User) => Promise<Either<Error, true>>;

  readonly delUserAllSessions: (
    fiscalCode: FiscalCode
  ) => Promise<Either<Error, boolean>>;

  /**
   * Retrieve the remining TTL for the CF-AssertionRef record
   * and the Login Type (`LEGACY` of `LV`).
   * The TTL value is the same of the Session expire time.
   * If the record is missing the result value is `None`.
   * If the recors hasn't an expire time an error is returned.
   *
   * @param fiscalCode
   */
  readonly getSessionRemainingTTL: (
    fiscalCode: FiscalCode
  ) => TE.TaskEither<Error, O.Option<ActiveSessionInfo>>;
}
