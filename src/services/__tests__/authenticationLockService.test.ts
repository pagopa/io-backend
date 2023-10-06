import * as E from "fp-ts/Either";
import { aFiscalCode } from "../../__mocks__/user_mock";
import AuthenticationLockService from "../authenticationLockService";
import {
  createEntityMock,
  errorProfileLockedRecordIterator,
  listLockedProfileEntitiesMock,
  lockedProfileTableClient,
  profileLockedRecordIterator,
} from "../../__mocks__/lockedProfileTableClient";
import { RestError } from "@azure/data-tables";
import { UnlockCode } from "../../../generated/session/UnlockCode";

// -------------------------------------------
// Tests
// -------------------------------------------

describe("AuthenticationLockService#isUserAuthenticationLocked", () => {
  it("should return false if query returns no records from table storage", async () => {
    const service = new AuthenticationLockService(lockedProfileTableClient);

    const result = await service.isUserAuthenticationLocked(aFiscalCode)();

    expect(result).toEqual(E.right(false));
  });

  it("should return true if one or more not Released records are found it table storage", async () => {
    listLockedProfileEntitiesMock.mockImplementationOnce(
      profileLockedRecordIterator
    );

    const service = new AuthenticationLockService(lockedProfileTableClient);

    const result = await service.isUserAuthenticationLocked(aFiscalCode)();

    expect(result).toEqual(E.right(true));
  });

  it("should return an error if something went wrong", async () => {
    listLockedProfileEntitiesMock.mockImplementationOnce(
      errorProfileLockedRecordIterator
    );

    const service = new AuthenticationLockService(lockedProfileTableClient);

    const result = await service.isUserAuthenticationLocked(aFiscalCode)();

    expect(result).toEqual(E.left(Error("an Error")));
  });
});

describe("AuthenticationLockService#lockUserAuthentication", () => {
  const service = new AuthenticationLockService(lockedProfileTableClient);
  const anUnlockCode = "anUnlockCode" as UnlockCode;

  it("should return true if CF-unlockcode has been stored sucessfully in table storage", async () => {
    const result = await service.lockUserAuthentication(
      aFiscalCode,
      anUnlockCode
    )();

    expect(result).toEqual(E.right(true));
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
