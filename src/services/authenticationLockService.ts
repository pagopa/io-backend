/**
 * This service retrieves and updates the user profile from the API system using
 * an API client.
 */

import { TableClient, odata } from "@azure/data-tables";

import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/lib/Either";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import * as AI from "../utils/AsyncIterableTask";

import { UnlockCode } from "../../generated/session/UnlockCode";

export default class AuthenticationLockService {
  constructor(private readonly tableClient: TableClient) {}

  public readonly isUserAuthenticationLocked = (fiscalCode: FiscalCode) => {
    const queryFilter = odata`PartitionKey eq ${fiscalCode} and not Released`;

    return pipe(
      this.tableClient.listEntities({
        queryOptions: { filter: queryFilter },
      }),
      AI.fromAsyncIterable,
      AI.foldTaskEither(E.toError),
      TE.map((entities) => entities.length > 0)
    );
  };

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
          }),
        (_) => new Error("Something went wrong creating the record")
      ),
      TE.map((_) => true as const)
    );
}
