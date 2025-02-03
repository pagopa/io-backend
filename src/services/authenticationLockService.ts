/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import { TableClient, TransactionAction, odata } from "@azure/data-tables";

import * as t from "io-ts";

import { flow, identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as ROA from "fp-ts/ReadonlyArray";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
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
  public readonly isUserAuthenticationLocked = (
    fiscalCode: FiscalCode
  ): TE.TaskEither<Error, boolean> =>
    pipe(this.getUserAuthenticationLocks(fiscalCode), TE.map(ROA.isNonEmpty));

  /**
   * Retrieve all the user authentication lock data records
   *
   * @param fiscalCode the user fiscal code
   * @returns a list of all the user authentication lock data, if exists
   */
  public readonly getUserAuthenticationLockData = (
    fiscalCode: FiscalCode
  ): TE.TaskEither<Error, ReadonlyArray<NotReleasedAuthenticationLockData>> =>
    this.getUserAuthenticationLocks(fiscalCode);

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
            CreatedAt: new Date(),
          }),
        (_) => new Error("Something went wrong creating the record")
      ),
      TE.map((_) => true as const)
    );

  /**
   * Unlock the user authentication
   *
   * @param fiscalCode the CF of the user
   * @param unlockCodes the Unlock Code list to update
   * @returns
   */
  public readonly unlockUserAuthentication = (
    fiscalCode: FiscalCode,
    unlockCodes: ReadonlyArray<UnlockCode>
  ): TE.TaskEither<Error, true> =>
    pipe(
      unlockCodes,
      ROA.map(
        (unlockCode) =>
          [
            "update",
            {
              partitionKey: fiscalCode,
              rowKey: unlockCode,
              // eslint-disable-next-line sort-keys
              Released: true,
            },
          ] as TransactionAction
      ),
      (actions) =>
        TE.tryCatch(
          () => this.tableClient.submitTransaction(Array.from(actions)),
          identity
        ),
      TE.filterOrElseW(
        (response) => response.status === 202,
        () => void 0
      ),
      TE.mapLeft(() => new Error("Something went wrong updating the record")),
      TE.map(() => true as const)
    );

  // -----------------------------------
  // Private Methods
  // -----------------------------------

  private readonly getUserAuthenticationLocks = (fiscalCode: FiscalCode) =>
    pipe(
      this.tableClient.listEntities({
        queryOptions: {
          filter: odata`PartitionKey eq ${fiscalCode} and not Released`,
        },
      }),
      AI.fromAsyncIterable,
      AI.foldTaskEither(E.toError),
      TE.chainEitherK(
        flow(
          t.array(NotReleasedAuthenticationLockData).decode,
          E.mapLeft(errorsToError)
        )
      )
    );
}
