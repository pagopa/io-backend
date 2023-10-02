import * as E from "fp-ts/Either";
import { APIClient } from "../../clients/api";
import { aFiscalCode } from "../../__mocks__/user_mock";
import AuthenticationLockService from "../authenticationLockService";
import {
  errorProfileLockedRecordIterator,
  listLockedProfileEntitiesMock,
  lockedProfileTableClient,
  profileLockedRecordIterator,
} from "../../__mocks__/lockedProfileTableClient";

const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();
const mockCreateProfile = jest.fn();
const mockStartEmailValidationProcess = jest.fn();

// partial because we may not mock every method
const mockClient: Partial<ReturnType<APIClient>> = {
  createProfile: mockCreateProfile,
  startEmailValidationProcess: mockStartEmailValidationProcess,
  getProfile: mockGetProfile,
  updateProfile: mockUpdateProfile,
};
jest.mock("../../services/apiClientFactory", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getClient: () => mockClient,
    })),
  };
});

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
