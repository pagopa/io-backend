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
}
