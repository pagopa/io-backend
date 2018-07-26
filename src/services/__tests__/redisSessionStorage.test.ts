/* tslint:disable:no-any */
/* tslint:disable:no-duplicate-string */
/* tslint:disable:no-let */
/* tslint:disable:no-identical-functions */
/* tslint:disable:no-null-keyword */

import { left, right } from "fp-ts/lib/Either";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import * as lolex from "lolex";
import { createMockRedis } from "mock-redis-client";
import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { SpidLevelEnum } from "../../types/api/SpidLevel";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import RedisSessionStorage from "../redisSessionStorage";

const aTokenDurationSecs = 3600;
const theCurrentTimestampMillis = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anInvalidFiscalNumber = "INVALID-FC" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for a valid User
const aValidUser: User = {
  created_at: 1183518855,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  sessionIndex: "sessionIndex",
  session_token: "HexToKen" as SessionToken,
  spid_email: anEmailAddress,
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "HexToKen" as WalletToken
};

// mock for a invalid User
const anInvalidUser: User = {
  ...aValidUser,
  fiscal_code: anInvalidFiscalNumber
};

const mockGetNewToken = jest.fn();
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getNewToken: mockGetNewToken
    }))
  };
});

const mockSet = jest.fn();
const mockGet = jest.fn();
const mockDel = jest.fn();
const mockRedisClient = createMockRedis().createClient();
mockRedisClient.set = mockSet;
mockRedisClient.get = mockGet;
mockRedisClient.del = mockDel;

const sessionStorage = new RedisSessionStorage(
  mockRedisClient,
  aTokenDurationSecs
);

let clock: any;
beforeEach(() => {
  // We need to mock time to test token expiration.
  clock = lolex.install({ now: theCurrentTimestampMillis });

  jest.clearAllMocks();
});
afterEach(() => {
  clock = clock.uninstall();
});

describe("RedisSessionStorage#set", () => {
  it.each([
    [
      undefined,
      "OK",
      undefined,
      "OK",
      right(true),
      "should set a new session with valid values"
    ],
    [
      new Error("hmset error"),
      undefined,
      undefined,
      "OK",
      left(new Error("Error setting the token")),
      "should fail if Redis client returns an error on saving the session"
    ],
    [
      new Error("hmset error"),
      undefined,
      new Error("hset error"),
      undefined,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns an error on saving the session and error saving the mapping"
    ],
    [
      new Error("hmset error"),
      undefined,
      undefined,
      undefined,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns an error on saving the session and false saving the mapping"
    ],
    [
      undefined,
      undefined,
      undefined,
      "OK",
      left(new Error("Error setting the token")),
      "should fail if Redis client returns false on saving the session"
    ],
    [
      undefined,
      undefined,
      new Error("hset error"),
      undefined,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns false on saving the session and error saving the mapping"
    ],
    [
      undefined,
      undefined,
      undefined,
      undefined,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns false on saving the session and false saving the mapping"
    ],
    [
      undefined,
      "OK",
      new Error("hset error"),
      undefined,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns an error on saving the mapping"
    ],
    [
      undefined,
      undefined,
      new Error("hset error"),
      undefined,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns an error on saving the mapping and false saving the session"
    ],
    [
      undefined,
      "OK",
      undefined,
      undefined,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns false on saving the mapping"
    ],
    [
      new Error("hmset error"),
      undefined,
      undefined,
      undefined,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns false on saving the mapping and error saving the session"
    ]
  ])(
    "%s, %s, %s, %s, %s, %s",
    async (
      sessionSetErr: Error,
      sessionSetSuccess: boolean,
      walletSetErr: Error,
      walletSetSuccess: number,
      expected: Error
    ) => {
      mockSet.mockImplementationOnce((_, __, ___, ____, callback) => {
        callback(sessionSetErr, sessionSetSuccess);
      });

      mockSet.mockImplementationOnce((_, __, ___, ____, callback) => {
        callback(walletSetErr, walletSetSuccess);
      });

      const response = await sessionStorage.set(aValidUser);

      expect(mockSet).toHaveBeenCalledTimes(2);
      expect(mockSet.mock.calls[0][0]).toBe(
        `SESSION-${aValidUser.session_token}`
      );
      expect(mockSet.mock.calls[0][1]).toEqual(JSON.stringify(aValidUser));
      expect(mockSet.mock.calls[1][0]).toBe(
        `WALLET-${aValidUser.wallet_token}`
      );
      expect(mockSet.mock.calls[1][1]).toBe(aValidUser.session_token);

      expect(response).toEqual(expected);
    }
  );
});

describe("RedisSessionStorage#get", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, null);
    });

    const response = await sessionStorage.getBySessionToken(
      "inexistent token" as SessionToken
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][0]).toBe(`SESSION-${"inexistent token"}`);
    expect(response).toEqual(left(new Error("Session not found")));
  });

  it("should fail getting a session with invalid value", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, JSON.stringify(anInvalidUser));
    });

    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(left(new Error("Unable to decode the user")));
  });

  it("should return error if the session is expired", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, null);
    });

    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(left(new Error("Session not found")));
  });

  it("should get a session with valid values", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, JSON.stringify(aValidUser));
    });

    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(right(aValidUser));
  });
});

describe("RedisSessionStorage#del", () => {
  it.each([
    [undefined, 1, undefined, 1, right(true), "should delete a session"],
    [
      new Error("del error"),
      undefined,
      undefined,
      1,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns an error deleting the session"
    ],
    [
      new Error("del error"),
      undefined,
      new Error("hdel error"),
      undefined,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns an error deleting the session and an error deleting the mapping"
    ],
    [
      new Error("del error"),
      undefined,
      undefined,
      undefined,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns an error deleting the session and false deleting the mapping"
    ],
    [
      undefined,
      undefined,
      undefined,
      1,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns false on deleting the session"
    ],
    [
      undefined,
      undefined,
      new Error("hdel error"),
      undefined,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns false on deleting the session and error deleting the mapping"
    ],
    [
      undefined,
      undefined,
      undefined,
      undefined,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns false on deleting the session and false deleting the mapping"
    ],
    [
      undefined,
      1,
      new Error("hdel error"),
      undefined,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns an error on deleting the mapping"
    ],
    [
      undefined,
      undefined,
      new Error("hdel error"),
      undefined,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns an error on deleting the mapping and false deleting the session"
    ],
    [
      undefined,
      1,
      undefined,
      undefined,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns false on deleting the mapping"
    ],
    [
      new Error("del error"),
      undefined,
      undefined,
      undefined,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns false on deleting the mapping and error deleting the session"
    ]
  ])(
    "%s, %s, %s, %s, %s, %s",
    async (
      sessionDelErr: Error,
      sessionDelSuccess: boolean,
      walletDelErr: Error,
      walletDelSuccess: number,
      expected: Error
    ) => {
      mockDel.mockImplementationOnce((_, callback) => {
        callback(sessionDelErr, sessionDelSuccess);
      });

      mockDel.mockImplementationOnce((_, callback) => {
        callback(walletDelErr, walletDelSuccess);
      });

      const response = await sessionStorage.del(
        aValidUser.session_token,
        aValidUser.wallet_token
      );

      expect(mockDel).toHaveBeenCalledTimes(2);
      expect(mockDel.mock.calls[0][0]).toBe(
        `SESSION-${aValidUser.session_token}`
      );
      expect(mockDel.mock.calls[1][0]).toBe(
        `WALLET-${aValidUser.wallet_token}`
      );

      expect(response).toEqual(expected);
    }
  );
});
