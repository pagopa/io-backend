import { TableClient } from "@azure/data-tables";
import { aFiscalCode } from "./user_mock";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

export async function* profileLockedRecordIterator() {
  yield { partitionKey: aFiscalCode, rowKey: "123456789" };
}
export async function* noProfileLockedRecordIterator(): ReturnType<
  typeof profileLockedRecordIterator
> {}
export async function* errorProfileLockedRecordIterator(): ReturnType<
  typeof profileLockedRecordIterator
> {
  //Sonarcloud requires at least one `yield` before `throw` operation
  yield { partitionKey: "CF" as FiscalCode, rowKey: "" };
  throw new Error("an Error");
}
export const listLockedProfileEntitiesMock = jest.fn(
  noProfileLockedRecordIterator
);
export const lockedProfileTableClient: TableClient = {
  listEntities: listLockedProfileEntitiesMock,
} as unknown as TableClient;
