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
  preferred_email: anEmailAddress,
  sessionIndex: "sessionIndex",
  session_token: "HexToKen" as SessionToken,
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  wallet_token: "HexToKen" as WalletToken
};

// mock for a invalid User
const anInvalidUser: User = {
  ...aValidUser,
  fiscal_code: anInvalidFiscalNumber
};

// authentication constant
const mockSessionToken = "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b" as SessionToken;
const mockRefreshedSessionToken = "ac83a77d6e4c19a02b50b8abf1223b8d858f6aaf23ba286898ad5fe5e24e8893b2b96c3a4c575bff285dac2481580737" as SessionToken;
const mockWalletToken = "5ba5b99a982da1aa5eb4fd8643124474fa17ee3016c13c617ab79d2e7c8624bb80105c0c0cae9864e035a0d31a715043" as WalletToken;
const mockRefreshedWalletToken = "d9658f7e21a0891c596eff2baf2e077888016bb538dc2644067065ee5a430f5b858190afb19a85067ce99a009749a878" as WalletToken;

const mockGetNewToken = jest.fn();
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getNewToken: mockGetNewToken
    }))
  };
});

const mockHmset = jest.fn();
const mockHset = jest.fn();
const mockHgetall = jest.fn();
const mockDel = jest.fn();
const mockHdel = jest.fn();
const mockRedisClient = createMockRedis().createClient();
mockRedisClient.hmset = mockHmset;
mockRedisClient.hset = mockHset;
mockRedisClient.hgetall = mockHgetall;
mockRedisClient.del = mockDel;
mockRedisClient.hdel = mockHdel;

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
      true,
      undefined,
      1,
      right(true),
      "should set a new session with valid values"
    ],
    [
      new Error("hmset error"),
      undefined,
      undefined,
      1,
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
      2,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns an error on saving the session and false saving the mapping"
    ],
    [
      undefined,
      false,
      undefined,
      1,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns false on saving the session"
    ],
    [
      undefined,
      false,
      new Error("hset error"),
      undefined,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns false on saving the session and error saving the mapping"
    ],
    [
      undefined,
      false,
      undefined,
      2,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns false on saving the session and false saving the mapping"
    ],
    [
      undefined,
      true,
      new Error("hset error"),
      undefined,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns an error on saving the mapping"
    ],
    [
      undefined,
      false,
      new Error("hset error"),
      undefined,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns an error on saving the mapping and false saving the session"
    ],
    [
      undefined,
      true,
      undefined,
      2,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns false on saving the mapping"
    ],
    [
      new Error("hmset error"),
      undefined,
      undefined,
      2,
      left(new Error("Error setting the token")),
      "should fail if Redis client returns false on saving the mapping and error saving the session"
    ]
  ])(
    "%s, %s, %s, %s, %s, %s",
    async (
      hmsetErr: Error,
      hmsetSuccess: boolean,
      hsetErr: Error,
      hsetSuccess: number,
      expected: Error
    ) => {
      mockHmset.mockImplementation((_, __, callback) => {
        callback(hmsetErr, hmsetSuccess);
      });

      mockHset.mockImplementation((_, __, ___, callback) => {
        callback(hsetErr, hsetSuccess);
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

      expect(mockHset).toHaveBeenCalledTimes(1);
      expect(mockHset.mock.calls[0][0]).toBe("mapping_session_wallet_tokens");
      expect(mockHset.mock.calls[0][1]).toBe(aValidUser.session_token);
      expect(mockHset.mock.calls[0][2]).toBe(aValidUser.wallet_token);

      expect(response).toEqual(expected);
    }
  );
});

describe("RedisSessionStorage#get", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, undefined);
    });

    const response = await sessionStorage.get(
      "inexistent token" as SessionToken
    );

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
      0,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns an error deleting the session and false deleting the mapping"
    ],
    [
      undefined,
      2,
      undefined,
      1,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns false on deleting the session"
    ],
    [
      undefined,
      2,
      new Error("hdel error"),
      undefined,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns false on deleting the session and error deleting the mapping"
    ],
    [
      undefined,
      2,
      undefined,
      0,
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
      2,
      new Error("hdel error"),
      undefined,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns an error on deleting the mapping and false deleting the session"
    ],
    [
      undefined,
      1,
      undefined,
      0,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns false on deleting the mapping"
    ],
    [
      new Error("del error"),
      undefined,
      undefined,
      2,
      left(new Error("Error deleting the token")),
      "should fail if Redis client returns false on deleting the mapping and error deleting the session"
    ]
  ])(
    "%s, %s, %s, %s, %s, %s",
    async (
      delErr: Error,
      delSuccess: boolean,
      hdelErr: Error,
      hdelSuccess: number,
      expected: Error
    ) => {
      mockDel.mockImplementation((_, callback) => {
        callback(delErr, delSuccess);
      });

      mockHdel.mockImplementation((_, __, callback) => {
        callback(hdelErr, hdelSuccess);
      });

      const response = await sessionStorage.del(
        aValidUser.session_token,
        aValidUser.wallet_token
      );

      expect(mockDel).toHaveBeenCalledTimes(1);
      expect(mockDel.mock.calls[0][0]).toBe(aValidUser.session_token);

      expect(mockHdel).toHaveBeenCalledTimes(1);
      expect(mockHdel.mock.calls[0][0]).toBe("mapping_session_wallet_tokens");
      expect(mockHdel.mock.calls[0][1]).toBe(aValidUser.wallet_token);

      expect(response).toEqual(expected);
    }
  );
});

describe("RedisSessionStorage#refresh", () => {
  it("should fail if Redis client returns an error", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(
        new Error("Session not found or unable to decode the user"),
        undefined
      );
    });

    const response = await sessionStorage.refresh(
      mockSessionToken,
      mockWalletToken,
      mockRefreshedSessionToken,
      mockRefreshedWalletToken
    );

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(mockSessionToken);
    expect(response).toEqual(
      left(new Error("Session not found or unable to decode the user"))
    );
  });

  it("should fail if Redis client returns an invalid user", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, {
        timestampEpochMillis: theCurrentTimestampMillis,
        user: anInvalidUser
      });
    });

    const response = await sessionStorage.refresh(
      mockSessionToken,
      mockWalletToken,
      mockRefreshedSessionToken,
      mockRefreshedWalletToken
    );

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(mockSessionToken);
    expect(response).toEqual(
      left(new Error("Session not found or unable to decode the user"))
    );
  });

  it("should fail if Redis client returns an invalid session", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, { key: "invalid" });
    });

    const response = await sessionStorage.refresh(
      mockSessionToken,
      mockWalletToken,
      mockRefreshedSessionToken,
      mockRefreshedWalletToken
    );

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(mockSessionToken);
    expect(response).toEqual(
      left(new Error("Session not found or unable to decode the user"))
    );
  });

  it("should refresh the session and wallet tokens", async () => {
    mockHgetall.mockImplementation((_, callback) => {
      callback(undefined, {
        timestampEpochMillis: String(theCurrentTimestampMillis),
        user: JSON.stringify(aValidUser)
      });
    });

    mockHmset.mockImplementation((_, __, callback) => {
      callback(undefined, 1);
    });

    mockHset.mockImplementation((_, __, ___, callback) => {
      callback(undefined, 1);
    });

    mockDel.mockImplementation((_, callback) => {
      callback(undefined, 1);
    });

    mockHdel.mockImplementation((_, __, callback) => {
      callback(undefined, 1);
    });

    const response = await sessionStorage.refresh(
      mockSessionToken,
      mockWalletToken,
      mockRefreshedSessionToken,
      mockRefreshedWalletToken
    );

    expect(mockHgetall).toHaveBeenCalledTimes(1);
    expect(mockHgetall.mock.calls[0][0]).toBe(mockSessionToken);
    expect(response).toEqual(
      right({
        expireAt: new Date(
          theCurrentTimestampMillis + aTokenDurationSecs * 1000
        ),
        newToken: mockRefreshedSessionToken,
        user: {
          ...aValidUser,
          session_token: mockRefreshedSessionToken,
          wallet_token: mockRefreshedWalletToken
        }
      })
    );
  });
});
