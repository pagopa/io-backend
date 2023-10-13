/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import { TableClient, odata } from "@azure/data-tables";

import * as t from "io-ts";

import { flow, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/Option";

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { DateFromString } from "@pagopa/ts-commons/lib/dates";

import { errorsToError } from "../utils/errorsFormatter";
import * as AI from "../utils/AsyncIterableTask";

import { UnlockCode } from "../../generated/session/UnlockCode";

export type NotReleasedAuthenticationLockData = t.TypeOf<
  typeof NotReleasedAuthenticationLockData
>;
const NotReleasedAuthenticationLockData = t.type({
  partitionKey: FiscalCode,
  rowKey: UnlockCode,

  // eslint-disable-next-line sort-keys
  CreatedAt: DateFromString,
});

export default class AuthenticationLockService {
  constructor(private readonly tableClient: TableClient) {}

  /**
   * Check whether user authentication is locked
   *
   * @param fiscalCode the user fiscal code
   * @returns true if user authentication is locked, false otherwise
   */
  public readonly isUserAuthenticationLocked = (fiscalCode: FiscalCode) =>
    pipe(
      this.getUserAuthenticationLocks(fiscalCode),
      TE.map((entities) => entities.length > 0)
    );

  /**
   * Retrieve the user authentication lock data with unlockCode
   *
   * @param fiscalCode the user fiscal code
   * @returns the user authentication lock data, if exists
   */
  public readonly getUserAuthenticationLockData = (fiscalCode: FiscalCode) =>
    pipe(
      this.getUserAuthenticationLocks(fiscalCode),
      TE.map((entities) => entities.at(0)),
      TE.map(O.fromNullable)
    );

  /**
   * Lock the user authentication
   *
   * @param fiscalCode the CF of the user
   * @param unlockCode the code to verify while performing unlock
   * @returns
   */
  public readonly lockUserAuthentication = (
    fiscalCode: FiscalCode,
    unlockCode: UnlockCode
  ): TE.TaskEither<Error, true> =>
    pipe(
      TE.tryCatch(
        () =>
          this.tableClient.createEntity({
            partitionKey: fiscalCode,
            rowKey: unlockCode,

            // eslint-disable-next-line sort-keys
            CreatedAt: new Date(Date.now()),
          }),
        (_) => new Error("Something went wrong creating the record")
      ),
      TE.map((_) => true as const)
    );

  /**
   * Unock the user authentication
   *
   * @param fiscalCode the CF of the user
   * @param unlockCode the Unlock Code to verify
   * @returns
   */
  public readonly unlockUserAuthentication = (
    fiscalCode: FiscalCode,
    unlockCode: UnlockCode
  ): TE.TaskEither<Error, true> =>
    pipe(
      TE.tryCatch(
        () =>
          this.tableClient.updateEntity({
            partitionKey: fiscalCode,
            rowKey: unlockCode,

            // eslint-disable-next-line sort-keys
            Released: true,
          }),
        (_) => new Error("Something went wrong updating the record")
      ),
      TE.map((_) => true as const)
    );

  // -----------------------------------
  // Private Methods
  // -----------------------------------

  private readonly getUserAuthenticationLocks = (fiscalCode: FiscalCode) => {
    const queryFilter =
      odata`PartitionKey eq ${fiscalCode} and not Released` as NonEmptyString;
    return pipe(
      this.tableClient.listEntities({
        queryOptions: { filter: queryFilter },
      }),
      AI.fromAsyncIterable,
      AI.foldTaskEither(E.toError),
      TE.chainEitherKW(
        flow(
          t.array(NotReleasedAuthenticationLockData).decode,
          E.mapLeft(errorsToError)
        )
      )
    );
  };
}
