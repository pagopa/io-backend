// tslint:disable no-object-mutation

import { left, right } from "fp-ts/lib/Either";
import { RedisClientType } from "redis";
import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { UserMetadata } from "../../../generated/backend/UserMetadata";
import { User } from "../../types/user";
import { mockSessionToken, mockWalletToken } from "../../__mocks__/user_mock";
import RedisUserMetadataStorage, {
  invalidVersionNumberError,
  metadataNotFoundError
} from "../redisUserMetadataStorage";

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for a valid User
const aValidUser: User = {
  created_at: 1183518855,
  date_of_birth: "2002-01-01",
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  session_token: mockSessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  wallet_token: mockWalletToken
};

const metadata: string = "GENERIC-USER-METADATA";
const aValidUserMetadata: UserMetadata = {
  metadata,
  version: 10
};
const validNewVersion = 11;

const mockSet = jest.fn();
const mockGet = jest.fn();
const mockRedisClient = ({
  get: mockGet,
  set: mockSet
} as unknown) as RedisClientType;

const userMetadataStorage = new RedisUserMetadataStorage(mockRedisClient);
const redisClientError = new Error("REDIS CLIENT ERROR");

const redisMethodImplFromError = (
  mockFunction: jest.Mock<unknown, any>,
  success?: unknown,
  error?: Error
) =>
  mockFunction.mockImplementationOnce(() =>
    error ? Promise.reject(error) : Promise.resolve(success)
  );

describe("RedisUserMetadataStorage#get", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it.each([
    [
      undefined,
      JSON.stringify(aValidUserMetadata),
      right(aValidUserMetadata),
      "should get current user metadata for the user"
    ],
    [
      undefined,
      "Invalid JSON",
      left(new Error("Unable to parse the user metadata json")),
      "should fail if user metadata parse fails"
    ],
    [
      undefined,
      JSON.stringify({ message: "Invalid" }),
      left(new Error("Unable to decode the user metadata")),
      "should fail if user metadata decode fails"
    ],
    [
      undefined,
      null,
      left(metadataNotFoundError),
      "should fail if user metadata don't exists"
    ],
    [
      redisClientError,
      undefined,
      left(redisClientError),
      "should fail if user metadata don't exists"
    ]
  ])("%s, %s, %s, %s", async (mockGetError, mockGetResponse, expected, _) => {
    redisMethodImplFromError(mockGet, mockGetResponse, mockGetError);

    const response = await userMetadataStorage.get(aValidUser);
    expect(mockGet).toHaveBeenCalledWith(`USERMETA-${aValidUser.fiscal_code}`);
    expect(response).toEqual(expected);
  });
});

describe("RedisUserMetadataStorage#get", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update user metadata", async () => {
    mockGet.mockImplementation(_ =>
      Promise.resolve(JSON.stringify(aValidUserMetadata))
    );
    mockSet.mockImplementation((_, __) => Promise.resolve("OK"));

    const newMetadata: UserMetadata = {
      metadata,
      version: validNewVersion
    };
    const response = await userMetadataStorage.set(aValidUser, newMetadata);
    expect(mockGet).toHaveBeenCalledWith(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet).toHaveBeenCalledWith(
      `USERMETA-${aValidUser.fiscal_code}`,
      JSON.stringify(newMetadata)
    );
    expect(response).toEqual(right(true));
  });

  it("should set user metadata if don't exists", async () => {
    mockGet.mockImplementation(_ => Promise.resolve(null));
    mockSet.mockImplementation((_, __) => Promise.resolve("OK"));

    const newMetadata: UserMetadata = {
      metadata,
      version: 1
    };
    const response = await userMetadataStorage.set(aValidUser, newMetadata);
    expect(mockGet).toHaveBeenCalledWith(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet).toHaveBeenCalledWith(
      `USERMETA-${aValidUser.fiscal_code}`,
      JSON.stringify(newMetadata)
    );
    expect(response).toEqual(right(true));
  });

  it("should fail update user metadata with invalid version number", async () => {
    mockGet.mockImplementation(_ =>
      Promise.resolve(JSON.stringify(aValidUserMetadata))
    );

    const newMetadata: UserMetadata = {
      metadata,
      version: aValidUserMetadata.version - 1
    };
    const response = await userMetadataStorage.set(aValidUser, newMetadata);
    expect(mockGet).toHaveBeenCalledWith(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet).not.toHaveBeenCalled();
    expect(response).toEqual(left(invalidVersionNumberError));
  });

  it("should fail update user metadata if redis client error occours on get", async () => {
    mockGet.mockImplementation(_ => Promise.reject(redisClientError));
    const newMetadata: UserMetadata = {
      metadata,
      version: 1
    };
    const response = await userMetadataStorage.set(aValidUser, newMetadata);
    expect(mockGet).toHaveBeenCalledWith(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet).not.toHaveBeenCalled();
    expect(response).toEqual(left(redisClientError));
  });

  it("should fail update user metadata if redis client error occours on set", async () => {
    mockGet.mockImplementation(_ =>
      Promise.resolve(JSON.stringify(aValidUserMetadata))
    );
    mockSet.mockImplementation((_, __) => Promise.reject(redisClientError));

    const newMetadata: UserMetadata = {
      metadata,
      version: validNewVersion
    };
    const response = await userMetadataStorage.set(aValidUser, newMetadata);
    expect(mockGet).toHaveBeenCalledWith(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet).toHaveBeenCalledWith(
      `USERMETA-${aValidUser.fiscal_code}`,
      JSON.stringify(newMetadata)
    );
    expect(response).toEqual(left(redisClientError));
  });
});
