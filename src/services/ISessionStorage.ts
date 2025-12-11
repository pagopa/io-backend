/**
 * Interface for the session storage services.
 */

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import * as O from "fp-ts/lib/Option";

import { AssertionRef as BackendAssertionRef } from "../../generated/backend/AssertionRef";
import { LollipopData } from "../types/assertionRef";
import { SessionToken } from "../types/token";
import { User } from "../types/user";

export interface ISessionStorage {
  /**
   * Retrieves a value from the cache using the session token.
   */
  readonly getBySessionToken: (
    token: SessionToken
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

  readonly delPagoPaNoticeEmail: (user: User) => Promise<Either<Error, true>>;
}
