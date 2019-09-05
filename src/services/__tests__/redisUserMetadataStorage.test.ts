// tslint:disable no-object-mutation

import { Either, left, right } from "fp-ts/lib/Either";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { createMockRedis } from "mock-redis-client";
import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { UserMetadata } from "../../../generated/backend/UserMetadata";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
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
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  session_token: "HexToKen" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "HexToKen" as WalletToken
};

const metadata: string = "GENERIC-USER-METADATA";
const aValidUserMetadata: UserMetadata = {
  metadata,
  version: 10
};
const validNewVersion = 11;

const mockSet = jest.fn();
const mockGet = jest.fn();
const mockRedisClient = createMockRedis().createClient();
mockRedisClient.set = mockSet;
mockRedisClient.get = mockGet;

const userMetadataStorage = new RedisUserMetadataStorage(mockRedisClient);
const redisClientError = new Error("REDIS CLIENT ERROR");

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
  ])(
    "%s, %s, %s, %s",
    async (
      mockGetError: Error,
      mockGetResponse: string | undefined,
      expected: Either<Error, UserMetadata>
    ) => {
      mockGet.mockImplementation((_, callback) => {
        callback(mockGetError, mockGetResponse);
      });

      const response = await userMetadataStorage.get(aValidUser);
      expect(mockGet.mock.calls[0][0]).toBe(
        `USERMETA-${aValidUser.fiscal_code}`
      );
      expect(response).toEqual(expected);
    }
  );
});

describe("RedisUserMetadataStorage#get", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update user metadata", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, JSON.stringify(aValidUserMetadata));
    });
    mockSet.mockImplementation((_, __, callback) => {
      callback(undefined, "OK");
    });
    const newMetadata: UserMetadata = {
      metadata,
      version: validNewVersion
    };
    const response = await userMetadataStorage.set(aValidUser, newMetadata);
    expect(mockGet.mock.calls[0][0]).toBe(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet.mock.calls[0][0]).toBe(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet.mock.calls[0][1]).toBe(JSON.stringify(newMetadata));
    expect(response).toEqual(right(true));
  });

  it("should set user metadata if don't exists", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, null);
    });
    mockSet.mockImplementation((_, __, callback) => {
      callback(undefined, "OK");
    });
    const newMetadata: UserMetadata = {
      metadata,
      version: 1
    };
    const response = await userMetadataStorage.set(aValidUser, newMetadata);
    expect(mockGet.mock.calls[0][0]).toBe(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet.mock.calls[0][0]).toBe(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet.mock.calls[0][1]).toBe(JSON.stringify(newMetadata));
    expect(response).toEqual(right(true));
  });

  it("should fail update user metadata with invalid version number", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, JSON.stringify(aValidUserMetadata));
    });
    const newMetadata: UserMetadata = {
      metadata,
      version: aValidUserMetadata.version - 1
    };
    const response = await userMetadataStorage.set(aValidUser, newMetadata);
    expect(mockGet.mock.calls[0][0]).toBe(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet).not.toBeCalled();
    expect(response).toEqual(left(invalidVersionNumberError));
  });

  it("should fail update user metadata if redis client error occours on get", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(redisClientError, undefined);
    });
    const newMetadata: UserMetadata = {
      metadata,
      version: 1
    };
    const response = await userMetadataStorage.set(aValidUser, newMetadata);
    expect(mockGet.mock.calls[0][0]).toBe(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet).not.toBeCalled();
    expect(response).toEqual(left(redisClientError));
  });

  it("should fail update user metadata if redis client error occours on set", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, JSON.stringify(aValidUserMetadata));
    });
    mockSet.mockImplementation((_, __, callback) => {
      callback(redisClientError, undefined);
    });
    const newMetadata: UserMetadata = {
      metadata,
      version: validNewVersion
    };
    const response = await userMetadataStorage.set(aValidUser, newMetadata);
    expect(mockGet.mock.calls[0][0]).toBe(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet.mock.calls[0][0]).toBe(`USERMETA-${aValidUser.fiscal_code}`);
    expect(mockSet.mock.calls[0][1]).toBe(JSON.stringify(newMetadata));
    expect(response).toEqual(left(redisClientError));
  });
});
