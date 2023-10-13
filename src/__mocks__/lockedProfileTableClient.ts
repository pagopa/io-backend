import {
  TableClient,
  TableInsertEntityHeaders,
  TableUpdateEntityHeaders,
} from "@azure/data-tables";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { aFiscalCode } from "./user_mock";
import { UnlockCode } from "../../generated/session/UnlockCode";

// --------------------------------
// Data
// --------------------------------

export const anUnlockCode = "123456789" as UnlockCode;

export const aNotReleasedData = {
  partitionKey: aFiscalCode,
  rowKey: anUnlockCode,
  CreatedAt: new Date(2022, 1, 1),
};

// --------------------------------
// Azure TableClient Mock
// --------------------------------

export async function* profileLockedRecordIterator() {
  yield aNotReleasedData;
}
export async function* noProfileLockedRecordIterator(): ReturnType<
  typeof profileLockedRecordIterator
> {}
export async function* errorProfileLockedRecordIterator(): ReturnType<
  typeof profileLockedRecordIterator
> {
  //Sonarcloud requires at least one `yield` before `throw` operation
  yield aNotReleasedData;
  throw new Error("an Error");
}
export async function* brokeEntityProfileLockedRecordIterator(): ReturnType<
  typeof profileLockedRecordIterator
> {
  //Sonarcloud requires at least one `yield` before `throw` operation
  yield {
    ...aNotReleasedData,
    partitionKey: "CF" as FiscalCode,
  };
}

export const listLockedProfileEntitiesMock = jest.fn(
  noProfileLockedRecordIterator
);

export const createEntityMock = jest.fn(
  async () => ({} as TableInsertEntityHeaders)
);
export const updateEntityMock = jest.fn(
  async () => ({} as TableUpdateEntityHeaders)
);

export const lockedProfileTableClient: TableClient = {
  createEntity: createEntityMock,
  listEntities: listLockedProfileEntitiesMock,
  updateEntity: updateEntityMock,
} as unknown as TableClient;
