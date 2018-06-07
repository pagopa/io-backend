/* tslint:disable:no-any */
/* tslint:disable:no-duplicate-string */
/* tslint:disable:no-let */
/* tslint:disable:no-identical-functions */

import { left, right } from "fp-ts/lib/Either";
import * as lolex from "lolex";
import { createMockRedis } from "mock-redis-client";
import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { SpidLevelEnum } from "../../types/api/SpidLevel";
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
  preferred_email: anEmailAddress,
  sessionIndex: "sessionIndex",
  session_token: "HexToKen",
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  wallet_token: "HexToKen"
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

const mockHmset = jest.fn();
const mockHgetall = jest.fn();
const mockDel = jest.fn();
const mockRedisClient = createMockRedis().createClient();
mockRedisClient.hmset = mockHmset;
mockRedisClient.hgetall = mockHgetall;
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
  it("should set a new session with valid values", async () => {
    mockHmset.mockImplementation((_, __, callback) => {
      callback(undefined, true);
    });

    const response = await sessionStorage.set(
      aValidUser,
      theCurrentTimestampMillis
    );

    expect(mockHmset).toHaveBeenCalledTimes(1);
    expect(mockHmset.mock.calls[0][0]).toBe(aValidUser.session_token);
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
      aValidUser,
      theCurrentTimestampMillis
    );

    expect(mockHmset).toHaveBeenCalledTimes(1);
    expect(mockHmset.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(mockHmset.mock.calls[0][1]).toEqual({
      timestampEpochMillis: theCurrentTimestampMillis,
      user: JSON.stringify(aValidUser)
    });
    expect(response).toEqual(left(new Error("Error setting the token")));
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

    const response = await sessionStorage.get(aValidUser.session_token);

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(response).toEqual(
      left(new Error("Session not found or unable to decode the user"))
    );
  });

  it("should get a session even if it's expired", async () => {
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

    const response = await sessionStorage.get(aValidUser.session_token);

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(response).toEqual(
      right({
        expireAt: new Date(anExpiredTimestamp + aTokenDurationSecs * 1000),
        user: aValidUser
      })
    );
  });

  it("should get a session with valid values", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, {
        timestampEpochMillis: String(theCurrentTimestampMillis),
        user: JSON.stringify(aValidUser)
      });
    });

    const response = await sessionStorage.get(aValidUser.session_token);

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(response).toEqual(
      right({
        expireAt: new Date(
          theCurrentTimestampMillis + aTokenDurationSecs * 1000
        ),
        user: aValidUser
      })
    );
  });
});

describe("RedisSessionStorage#del", () => {
  it("should delete a session", async () => {
    const successfullyDelete = 1;
    mockDel.mockImplementation((_, callback) => {
      callback(undefined, successfullyDelete);
    });

    const response = await sessionStorage.del(
      aValidUser.session_token,
      aValidUser.wallet_token
    );

    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(response).toEqual(right(true));
  });

  it("should fail if Redis client returns an error", async () => {
    mockDel.mockImplementation((_, callback) => {
      callback(new Error("Error deleting the token"), undefined);
    });

    const response = await sessionStorage.del(
      aValidUser.session_token,
      aValidUser.wallet_token
    );

    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(response).toEqual(left(new Error("Error deleting the token")));
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
    const successfullyDelete = 1;
    mockDel.mockImplementation((_, callback) => {
      callback(undefined, successfullyDelete);
    });

    const response = await sessionStorage.refresh(
      aValidUser.session_token,
      aValidUser.wallet_token,
      "123456",
      "123456"
    );

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(mockHmset).toHaveBeenCalledTimes(1);
    expect(mockHmset.mock.calls[0][0]).toBe("123456");
    expect(mockHmset.mock.calls[0][1]).toEqual({
      timestampEpochMillis: theCurrentTimestampMillis,
      user: JSON.stringify(aValidUser)
    });
    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(response).toEqual(
      right({
        expireAt: new Date(
          theCurrentTimestampMillis + aTokenDurationSecs * 1000
        ),
        newToken: "123456",
        user: aValidUser
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

    const response = await sessionStorage.refresh(
      aValidUser.session_token,
      aValidUser.wallet_token,
      "",
      ""
    );

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(response).toEqual(
      left(new Error("Session not found or unable to decode the user"))
    );
  });

  it("should fail if session delete fails for a Redis error", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, {
        timestampEpochMillis: String(theCurrentTimestampMillis),
        user: JSON.stringify(aValidUser)
      });
    });
    mockHmset.mockImplementation((_, __, callback) => {
      callback(undefined, true);
    });
    mockDel.mockImplementation((_, callback) => {
      callback(new Error("del error"), undefined);
    });
    mockGetNewToken.mockReturnValue("123456");

    const response = await sessionStorage.refresh(
      aValidUser.session_token,
      aValidUser.wallet_token,
      "",
      ""
    );

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(response).toEqual(left(new Error("Error refreshing the token")));
  });

  it("should fail if session delete fails with incorrect response", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, {
        timestampEpochMillis: String(theCurrentTimestampMillis),
        user: JSON.stringify(aValidUser)
      });
    });
    mockHmset.mockImplementation((_, __, callback) => {
      callback(undefined, true);
    });
    const successfullyDelete = 0;
    mockDel.mockImplementation((_, callback) => {
      callback(undefined, successfullyDelete);
    });
    mockGetNewToken.mockReturnValue("123456");

    const response = await sessionStorage.refresh(
      aValidUser.session_token,
      aValidUser.wallet_token,
      "",
      ""
    );

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(response).toEqual(left(new Error("Error refreshing the token")));
  });

  it("should fail if session set fails for a Redis error", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, {
        timestampEpochMillis: String(theCurrentTimestampMillis),
        user: JSON.stringify(aValidUser)
      });
    });
    mockHmset.mockImplementation((_, __, callback) => {
      callback(new Error("hmset error"), true);
    });
    const successfullyDelete = 1;
    mockDel.mockImplementation((_, callback) => {
      callback(undefined, successfullyDelete);
    });
    mockGetNewToken.mockReturnValue("123456");

    const response = await sessionStorage.refresh(
      aValidUser.session_token,
      aValidUser.wallet_token,
      "",
      ""
    );

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(response).toEqual(left(new Error("Error refreshing the token")));
  });

  it("should fail if session set fails with incorrect response", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, {
        timestampEpochMillis: String(theCurrentTimestampMillis),
        user: JSON.stringify(aValidUser)
      });
    });
    mockHmset.mockImplementation((_, __, callback) => {
      callback(undefined, false);
    });
    const successfullyDelete = 1;
    mockDel.mockImplementation((_, callback) => {
      callback(undefined, successfullyDelete);
    });
    mockGetNewToken.mockReturnValue("123456");

    const response = await sessionStorage.refresh(
      aValidUser.session_token,
      aValidUser.wallet_token,
      "",
      ""
    );

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(aValidUser.session_token);
    expect(response).toEqual(left(new Error("Error refreshing the token")));
  });
});
