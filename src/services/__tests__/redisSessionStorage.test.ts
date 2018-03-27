/* tslint:disable:no-any */
/* tslint:disable:no-duplicate-string */
/* tslint:disable:no-let */
/* tslint:disable:no-identical-functions */

import { left, right } from "fp-ts/lib/Either";
import * as lolex from "lolex";
import { createMockRedis } from "mock-redis-client";
import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { User } from "../../types/user";
import RedisSessionStorage from "../redisSessionStorage";
import TokenService from "../tokenService";

const aTokenDurationSecs = 3600;
const theCurrentTimestampMillis = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anInvalidFiscalNumber = "INVALID-FC" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;

// mock for a valid User
const aValidUser: User = {
  created_at: 1183518855,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: anEmailAddress,
  sessionIndex: "sessionIndex",
  spid_idp: "spid_idp_name",
  token: "HexToKen"
};

// mock for a invalid User
const anInvalidUser: User = {
  ...aValidUser,
  fiscal_code: anInvalidFiscalNumber
};

// authentication constant
const mockToken =
  "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b";
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getNewToken: jest.fn(() => {
        return mockToken;
      })
    }))
  };
});

const mockGetNewToken = jest.fn();
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getNewToken: mockGetNewToken
    }))
  };
});
const tokenService = new TokenService();

const mockHmset = jest.fn();
const mockHgetall = jest.fn();
const mockDel = jest.fn();
const mockRedisClient = createMockRedis().createClient();
mockRedisClient.hmset = mockHmset;
mockRedisClient.hgetall = mockHgetall;
mockRedisClient.del = mockDel;

const sessionStorage = new RedisSessionStorage(
  mockRedisClient,
  aTokenDurationSecs,
  tokenService
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
  it("should set a new session with valid values", async () => {
    mockHmset.mockImplementation((_, __, callback) => {
      callback(undefined, true);
    });

    const response = await sessionStorage.set(
      aValidUser.token,
      aValidUser,
      theCurrentTimestampMillis
    );

    expect(mockHmset).toHaveBeenCalledTimes(1);
    expect(mockHmset.mock.calls[0][0]).toBe(aValidUser.token);
    expect(mockHmset.mock.calls[0][1]).toEqual({
      timestampEpochMillis: theCurrentTimestampMillis,
      user: JSON.stringify(aValidUser)
    });
    expect(response).toEqual(right(true));
  });

  it("should fail if Redis client returns an error", async () => {
    mockHmset.mockImplementation((_, __, callback) => {
      callback(new Error("hmset error"), undefined);
    });

    const response = await sessionStorage.set(
      aValidUser.token,
      aValidUser,
      theCurrentTimestampMillis
    );

    expect(mockHmset).toHaveBeenCalledTimes(1);
    expect(mockHmset.mock.calls[0][0]).toBe(aValidUser.token);
    expect(mockHmset.mock.calls[0][1]).toEqual({
      timestampEpochMillis: theCurrentTimestampMillis,
      user: JSON.stringify(aValidUser)
    });
    expect(response).toEqual(left(new Error("hmset error")));
  });
});

describe("RedisSessionStorage#get", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, undefined);
    });

    const response = await sessionStorage.get("inexistent token");

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe("inexistent token");
    expect(response).toEqual(
      left(new Error("Session not found or unable to decode the user"))
    );
  });

  it("should fail getting a session with invalid value", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, {
        timestampEpochMillis: String(theCurrentTimestampMillis),
        user: JSON.stringify(anInvalidUser)
      });
    });

    const response = await sessionStorage.get(aValidUser.token);

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.token);
    expect(response).toEqual(
      left(new Error("Session not found or unable to decode the user"))
    );
  });

  it("should fail getting an expired session", async () => {
    const aTokenDurationMillis = aTokenDurationSecs * 1000;
    const aTimeLongerThanDuration = aTokenDurationMillis + 2000;
    const anExpiredTimestamp =
      theCurrentTimestampMillis - aTimeLongerThanDuration;
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, {
        timestampEpochMillis: String(anExpiredTimestamp),
        user: JSON.stringify(aValidUser)
      });
    });

    const response = await sessionStorage.get(aValidUser.token);

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.token);
    expect(response).toEqual(left(new Error("Token has expired")));
  });

  it("should get a session with valid values", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, {
        timestampEpochMillis: String(theCurrentTimestampMillis),
        user: JSON.stringify(aValidUser)
      });
    });

    const response = await sessionStorage.get(aValidUser.token);

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.token);
    expect(response).toEqual(
      right({
        expireAt: theCurrentTimestampMillis + aTokenDurationSecs * 1000,
        expired: false,
        user: aValidUser
      })
    );
  });
});

describe("RedisSessionStorage#del", () => {
  it("should delete a session", async () => {
    const numberOfFieldsRemoved = 2;
    mockDel.mockImplementation((_, callback) => {
      callback(undefined, numberOfFieldsRemoved);
    });

    const response = await sessionStorage.del(aValidUser.token);

    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel.mock.calls[0][0]).toBe(aValidUser.token);
    expect(response).toEqual(right(true));
  });

  it("should fail if Redis client returns an error", async () => {
    mockDel.mockImplementation((_, callback) => {
      callback(new Error("del error"), undefined);
    });

    const response = await sessionStorage.del(aValidUser.token);

    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel.mock.calls[0][0]).toBe(aValidUser.token);
    expect(response).toEqual(left(new Error("del error")));
  });
});

describe("RedisSessionStorage#refresh", () => {
  it("should return a new session", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, {
        timestampEpochMillis: String(theCurrentTimestampMillis),
        user: JSON.stringify(aValidUser)
      });
    });
    mockHmset.mockImplementation((_, __, callback) => {
      callback(undefined, true);
    });
    const numberOfFieldsRemoved = 2;
    mockDel.mockImplementation((_, callback) => {
      callback(undefined, numberOfFieldsRemoved);
    });
    mockGetNewToken.mockReturnValue("123456");

    const response = await sessionStorage.refresh(aValidUser.token);

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.token);
    expect(mockHmset).toHaveBeenCalledTimes(1);
    expect(mockHmset.mock.calls[0][0]).toBe("123456");
    expect(mockHmset.mock.calls[0][1]).toEqual({
      timestampEpochMillis: theCurrentTimestampMillis,
      user: JSON.stringify(aValidUser)
    });
    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel.mock.calls[0][0]).toBe(aValidUser.token);
    expect(response).toEqual(
      right({
        expired: true,
        newToken: "123456"
      })
    );
  });

  it("should fail if session not found or unable to decode the user", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(
        new Error("Session not found or unable to decode the user"),
        undefined
      );
    });

    const response = await sessionStorage.refresh(aValidUser.token);

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.token);
    expect(response).toEqual(
      left(new Error("Session not found or unable to decode the user"))
    );
  });
});
