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
  throw new Error("an Error");
  //Sonarcloud requires at least one `yield`
  yield { partitionKey: "CF" as FiscalCode, rowKey: "" };
}
export const listLockedProfileEntitiesMock = jest.fn(
  noProfileLockedRecordIterator
);
export const lockedProfileTableClient: TableClient = {
  listEntities: listLockedProfileEntitiesMock,
} as unknown as TableClient;
