import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { aFiscalCode } from "../../__mocks__/user_mock";
import AuthenticationLockService from "../authenticationLockService";
import {
  brokeEntityProfileLockedRecordIterator,
  createEntityMock,
  errorProfileLockedRecordIterator,
  listLockedProfileEntitiesMock,
  lockedProfileTableClient,
  profileLockedRecordIterator,
  updateEntityMock,
} from "../../__mocks__/lockedProfileTableClient";
import { RestError } from "@azure/data-tables";
import { UnlockCode } from "../../../generated/session/UnlockCode";
import { aNotReleasedData } from "../../__mocks__/services.mock";

// -------------------------------------------
// Tests
// -------------------------------------------

describe("AuthenticationLockService#isUserAuthenticationLocked", () => {
  it("should return false if query returns no records from table storage", async () => {
    const service = new AuthenticationLockService(lockedProfileTableClient);

    const result = await service.isUserAuthenticationLocked(aFiscalCode)();

    expect(result).toEqual(E.right(false));
    expect(listLockedProfileEntitiesMock).toHaveBeenCalledWith({
      queryOptions: {
        filter: `PartitionKey eq '${aFiscalCode}' and not Released`,
      },
    });
  });

  it("should return true if one or more not Released records are found it table storage", async () => {
    listLockedProfileEntitiesMock.mockImplementationOnce(
      profileLockedRecordIterator
    );

    const service = new AuthenticationLockService(lockedProfileTableClient);

    const result = await service.isUserAuthenticationLocked(aFiscalCode)();

    expect(result).toEqual(E.right(true));
  });

  it("should return an error if something went wrong retrieving the records", async () => {
    listLockedProfileEntitiesMock.mockImplementationOnce(
      errorProfileLockedRecordIterator
    );

    const service = new AuthenticationLockService(lockedProfileTableClient);

    const result = await service.isUserAuthenticationLocked(aFiscalCode)();

    expect(result).toEqual(E.left(Error("an Error")));
  });

  it("should return an error if something went wrong decoding a record", async () => {
    listLockedProfileEntitiesMock.mockImplementationOnce(
      brokeEntityProfileLockedRecordIterator
    );

    const service = new AuthenticationLockService(lockedProfileTableClient);

    const result = await service.isUserAuthenticationLocked(aFiscalCode)();

    expect(result).toEqual(
      E.left(
        Error(
          'value ["CF"] at [root.0.partitionKey] is not a valid [string that matches the pattern "^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$"]'
        )
      )
    );
  });
});

describe("AuthenticationLockService#getUserAuthenticationLockData", () => {
  it("should return O.none if query returns no records from table storage", async () => {
    const service = new AuthenticationLockService(lockedProfileTableClient);

    const result = await service.getUserAuthenticationLockData(aFiscalCode)();

    expect(result).toEqual(E.right(O.none));
    expect(listLockedProfileEntitiesMock).toHaveBeenCalledWith({
      queryOptions: {
        filter: `PartitionKey eq '${aFiscalCode}' and not Released`,
      },
    });
  });

  it("should return O.some with the first record, if one or more not Released records are found it table storage", async () => {
    listLockedProfileEntitiesMock.mockImplementationOnce(
      profileLockedRecordIterator
    );

    const service = new AuthenticationLockService(lockedProfileTableClient);

    const result = await service.getUserAuthenticationLockData(aFiscalCode)();

    expect(result).toEqual(E.right(O.some(aNotReleasedData)));
  });

  it("should return an error if something went wrong retrieving the records", async () => {
    listLockedProfileEntitiesMock.mockImplementationOnce(
      errorProfileLockedRecordIterator
    );

    const service = new AuthenticationLockService(lockedProfileTableClient);

    const result = await service.getUserAuthenticationLockData(aFiscalCode)();

    expect(result).toEqual(E.left(Error("an Error")));
  });

  it("should return an error if something went wrong decoding a record", async () => {
    listLockedProfileEntitiesMock.mockImplementationOnce(
      brokeEntityProfileLockedRecordIterator
    );

    const service = new AuthenticationLockService(lockedProfileTableClient);

    const result = await service.getUserAuthenticationLockData(aFiscalCode)();

    expect(result).toEqual(
      E.left(
        Error(
          'value ["CF"] at [root.0.partitionKey] is not a valid [string that matches the pattern "^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$"]'
        )
      )
    );
  });
});

describe("AuthenticationLockService#lockUserAuthentication", () => {
  const service = new AuthenticationLockService(lockedProfileTableClient);
  const anUnlockCode = "anUnlockCode" as UnlockCode;

  beforeAll(() => {
    jest.useFakeTimers({ now: new Date(2020, 3, 1) });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should return true if CF-unlockcode has been stored sucessfully in table storage", async () => {
    const result = await service.lockUserAuthentication(
      aFiscalCode,
      anUnlockCode
    )();

    expect(result).toEqual(E.right(true));
    expect(createEntityMock).toHaveBeenCalledWith({
      partitionKey: aFiscalCode,
      rowKey: anUnlockCode,
      CreatedAt: new Date(2020, 3, 1),
    });
  });

  it("should return an Error when CF-unlockcode has already been stored in table storage", async () => {
    createEntityMock.mockRejectedValueOnce(
      new RestError("Conflict", { statusCode: 409 })
    );
    const result = await service.lockUserAuthentication(
      aFiscalCode,
      anUnlockCode
    )();

    expect(result).toEqual(
      E.left(new Error("Something went wrong creating the record"))
    );
  });

  it("should return an Error when an error occurred while storing value in table storage", async () => {
    createEntityMock.mockRejectedValueOnce(
      new RestError("Another Error", { statusCode: 418 })
    );
    const result = await service.lockUserAuthentication(
      aFiscalCode,
      anUnlockCode
    )();

    expect(result).toEqual(
      E.left(new Error("Something went wrong creating the record"))
    );
  });
});

describe("AuthenticationLockService#unlockUserAuthentication", () => {
  const service = new AuthenticationLockService(lockedProfileTableClient);
  const anUnlockCode = "anUnlockCode" as UnlockCode;

  it("should return true when record update succeded", async () => {
    const result = await service.unlockUserAuthentication(
      aFiscalCode,
      anUnlockCode
    )();

    expect(result).toEqual(E.right(true));
    expect(updateEntityMock).toHaveBeenCalledWith({
      partitionKey: aFiscalCode,
      rowKey: anUnlockCode,
      Released: true,
    });
  });

  it("should return an Error when no CF-unlock code was found", async () => {
    updateEntityMock.mockRejectedValueOnce(
      new RestError("Not Found", { statusCode: 404 })
    );
    const result = await service.unlockUserAuthentication(
      aFiscalCode,
      anUnlockCode
    )();

    expect(result).toEqual(
      E.left(new Error("Something went wrong updating the record"))
    );
  });

  it("should return an Error when an error occurred updating the record", async () => {
    updateEntityMock.mockRejectedValueOnce(
      new RestError("An Error", { statusCode: 500 })
    );
    const result = await service.unlockUserAuthentication(
      aFiscalCode,
      anUnlockCode
    )();

    expect(result).toEqual(
      E.left(new Error("Something went wrong updating the record"))
    );
  });
});
