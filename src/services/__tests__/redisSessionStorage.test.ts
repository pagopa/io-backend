/* tslint:disable:no-any */
/* tslint:disable:no-duplicate-string */
/* tslint:disable:no-let */
/* tslint:disable:no-identical-functions */
/* tslint:disable:no-null-keyword */
/* tslint:disable:no-object-mutation */

import { Either, left, Left, right } from "fp-ts/lib/Either";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import * as lolex from "lolex";
import { createMockRedis } from "mock-redis-client";

import { none, some } from "fp-ts/lib/Option";
import { ValidationError } from "io-ts";
import { errorsToReadableMessages } from "italia-ts-commons/lib/reporters";
import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SessionInfo } from "../../../generated/backend/SessionInfo";
import { SessionsList } from "../../../generated/backend/SessionsList";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import { multipleErrorsFormatter } from "../../utils/errorsFormatter";
import RedisSessionStorage, {
  sessionNotFoundError
} from "../redisSessionStorage";

const allowMultipleSessions = false;
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
  session_token: "HexToKen" as SessionToken,
  spid_email: anEmailAddress,
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
const mockMget = jest.fn();
const mockDel = jest.fn();
const mockSadd = jest.fn();
const mockSrem = jest.fn();
const mockSmembers = jest.fn();
const mockExists = jest.fn();
const mockRedisClient = createMockRedis().createClient();
mockRedisClient.set = mockSet;
mockRedisClient.get = mockGet;
mockRedisClient.mget = mockMget;
mockRedisClient.del = mockDel;
mockRedisClient.sadd = mockSadd;
mockRedisClient.srem = mockSrem;
mockRedisClient.smembers = mockSmembers;
mockRedisClient.exists = mockExists;

const sessionStorage = new RedisSessionStorage(
  mockRedisClient,
  aTokenDurationSecs,
  allowMultipleSessions
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
      left(
        multipleErrorsFormatter(
          [new Error("hmset error")],
          "RedisSessionStorage.set"
        )
      ),
      "should fail if Redis client returns an error on saving the session"
    ],
    [
      new Error("hmset error"),
      undefined,
      new Error("hset error"),
      undefined,
      left(
        multipleErrorsFormatter(
          [new Error("hmset error"), new Error("hset error")],
          "RedisSessionStorage.set"
        )
      ),
      "should fail if Redis client returns an error on saving the session and error saving the mapping"
    ],
    [
      new Error("hmset error"),
      undefined,
      undefined,
      undefined,
      left(
        multipleErrorsFormatter(
          [new Error("hmset error"), new Error("Error setting wallet token")],
          "RedisSessionStorage.set"
        )
      ),
      "should fail if Redis client returns an error on saving the session and false saving the mapping"
    ],
    [
      undefined,
      undefined,
      undefined,
      "OK",
      left(
        multipleErrorsFormatter(
          [new Error("Error setting session token")],
          "RedisSessionStorage.set"
        )
      ),
      "should fail if Redis client returns false on saving the session"
    ],
    [
      undefined,
      undefined,
      undefined,
      undefined,
      left(
        multipleErrorsFormatter(
          [
            new Error("Error setting session token"),
            new Error("Error setting wallet token")
          ],
          "RedisSessionStorage.set"
        )
      ),
      "should fail if Redis client returns false on saving the session and false saving the mapping"
    ],
    [
      undefined,
      "OK",
      new Error("hset error"),
      undefined,
      left(
        multipleErrorsFormatter(
          [new Error("hset error")],
          "RedisSessionStorage.set"
        )
      ),
      "should fail if Redis client returns an error on saving the mapping"
    ],
    [
      undefined,
      undefined,
      new Error("hset error"),
      undefined,
      left(
        multipleErrorsFormatter(
          [new Error("Error setting session token"), new Error("hset error")],
          "RedisSessionStorage.set"
        )
      ),
      "should fail if Redis client returns an error on saving the mapping and false saving the session"
    ],
    [
      undefined,
      "OK",
      undefined,
      undefined,
      left(
        multipleErrorsFormatter(
          [new Error("Error setting wallet token")],
          "RedisSessionStorage.set"
        )
      ),
      "should fail if Redis client returns false on saving the mapping"
    ],
    [
      new Error("hmset error"),
      undefined,
      undefined,
      undefined,
      left(
        multipleErrorsFormatter(
          [new Error("hmset error"), new Error("Error setting wallet token")],
          "RedisSessionStorage.set"
        )
      ),
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
      mockSet.mockImplementationOnce((_, __, ___, ____, callback) => {
        callback(undefined, "OK");
      });

      mockSadd.mockImplementation((_, __, callback) => {
        callback(undefined, 1);
      });

      mockSmembers.mockImplementation((_, callback) => {
        callback(undefined, []);
      });

      const response = await sessionStorage.set(aValidUser);

      expect(mockSet).toHaveBeenCalledTimes(3);
      expect(mockSet.mock.calls[0][0]).toBe(
        `SESSION-${aValidUser.session_token}`
      );
      expect(mockSet.mock.calls[0][1]).toEqual(JSON.stringify(aValidUser));
      expect(mockSet.mock.calls[1][0]).toBe(
        `WALLET-${aValidUser.wallet_token}`
      );
      expect(mockSet.mock.calls[1][1]).toBe(aValidUser.session_token);
      expect(mockSet.mock.calls[2][0]).toBe(
        `SESSIONINFO-${aValidUser.session_token}`
      );
      expect(mockSet.mock.calls[2][1]).toBeDefined();
      expect(JSON.parse(mockSet.mock.calls[2][1])).toHaveProperty("createdAt");
      expect(response).toEqual(expected);
    }
  );
});

describe("RedisSessionStorage#removeOtherUserSessions", () => {
  it("should delete only older session token", async () => {
    const oldSessionToken = "old_session_token";
    mockSmembers.mockImplementation((_, callback) => {
      callback(undefined, [
        `SESSIONINFO-${oldSessionToken}`,
        `SESSIONINFO-${oldSessionToken}2`,
        `SESSIONINFO-${aValidUser.session_token}`
      ]);
    });
    mockDel.mockImplementation((_, __, callback) => {
      callback(undefined, 1);
    });

    const response: Either<Error, boolean> = await sessionStorage[
      // tslint:disable-next-line: no-string-literal
      "removeOtherUserSessions"
    ](aValidUser);
    expect(mockSmembers).toBeCalledTimes(1);
    expect(mockSmembers.mock.calls[0][0]).toBe(
      `USERSESSIONS-${aValidUser.fiscal_code}`
    );
    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel.mock.calls[0][0]).toBe(`SESSION-${oldSessionToken}`);
    expect(mockDel.mock.calls[0][1]).toBe(`SESSION-${oldSessionToken}2`);
    expect(response.isRight());
  });
});

describe("RedisSessionStorage#getBySessionToken", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, null);
    });
    const response = await sessionStorage.getBySessionToken(
      "inexistent token" as SessionToken
    );
    expect(response).toEqual(right(none));
  });

  it("should fail getting a session with invalid value", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, JSON.stringify(anInvalidUser));
    });
    const expectedDecodedError = User.decode(anInvalidUser) as Left<
      ReadonlyArray<ValidationError>,
      User
    >;
    const expectedError = new Error(
      errorsToReadableMessages(expectedDecodedError.value).join("/")
    );
    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(left(expectedError));
  });

  it("should fail parse of user payload", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, "Invalid JSON");
    });

    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(left(new Error("Unable to parse the user json")));
  });

  it("should return error if the session is expired", async () => {
    mockGet.mockImplementation((_, callback) => {
      callback(undefined, null);
    });
    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(response).toEqual(right(none));
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
    expect(response).toEqual(right(some(aValidUser)));
  });
});

// tslint:disable-next-line: no-big-function
describe("RedisSessionStorage#del", () => {
  const expectedRedisDelSessionError = new Error("del error");
  const expectedRedisDelWalletError = new Error("hdel error");

  it.each([
    [undefined, 1, undefined, 1, right(true), "should delete a session"],
    [
      expectedRedisDelSessionError,
      undefined,
      undefined,
      1,
      left(
        multipleErrorsFormatter(
          [expectedRedisDelSessionError],
          "RedisSessionStorage.del"
        )
      ),
      "should fail if Redis client returns an error deleting the session"
    ],
    [
      expectedRedisDelSessionError,
      undefined,
      expectedRedisDelWalletError,
      undefined,
      left(
        multipleErrorsFormatter(
          [expectedRedisDelSessionError, expectedRedisDelWalletError],
          "RedisSessionStorage.del"
        )
      ),
      "should fail if Redis client returns an error deleting the session and an error deleting the mapping"
    ],
    [
      expectedRedisDelSessionError,
      undefined,
      undefined,
      undefined,
      left(
        multipleErrorsFormatter(
          [
            expectedRedisDelSessionError,
            new Error(
              "Unexpected response from redis client deleting walletToken."
            )
          ],
          "RedisSessionStorage.del"
        )
      ),
      "should fail if Redis client returns an error deleting the session and false deleting the mapping"
    ],
    [
      undefined,
      undefined,
      undefined,
      1,
      left(
        multipleErrorsFormatter(
          [
            new Error(
              "Unexpected response from redis client deleting sessionInfoKey and sessionToken."
            )
          ],
          "RedisSessionStorage.del"
        )
      ),
      "should fail if Redis client returns false on deleting the session"
    ],
    [
      undefined,
      undefined,
      expectedRedisDelWalletError,
      undefined,
      left(
        multipleErrorsFormatter(
          [
            new Error(
              "Unexpected response from redis client deleting sessionInfoKey and sessionToken."
            ),
            expectedRedisDelWalletError
          ],
          "RedisSessionStorage.del"
        )
      ),
      "should fail if Redis client returns false on deleting the session and error deleting the mapping"
    ],
    [
      undefined,
      undefined,
      undefined,
      undefined,
      left(
        multipleErrorsFormatter(
          [
            new Error(
              "Unexpected response from redis client deleting sessionInfoKey and sessionToken."
            ),
            new Error(
              "Unexpected response from redis client deleting walletToken."
            )
          ],
          "RedisSessionStorage.del"
        )
      ),
      "should fail if Redis client returns false on deleting the session and false deleting the mapping"
    ],
    [
      undefined,
      1,
      expectedRedisDelWalletError,
      undefined,
      left(
        multipleErrorsFormatter(
          [expectedRedisDelWalletError],
          "RedisSessionStorage.del"
        )
      ),
      "should fail if Redis client returns an error on deleting the mapping"
    ],
    [
      undefined,
      undefined,
      expectedRedisDelWalletError,
      undefined,
      left(
        multipleErrorsFormatter(
          [
            new Error(
              "Unexpected response from redis client deleting sessionInfoKey and sessionToken."
            ),
            expectedRedisDelWalletError
          ],
          "RedisSessionStorage.del"
        )
      ),
      "should fail if Redis client returns an error on deleting the mapping and false deleting the session"
    ],
    [
      undefined,
      1,
      undefined,
      undefined,
      left(
        multipleErrorsFormatter(
          [
            new Error(
              "Unexpected response from redis client deleting walletToken."
            )
          ],
          "RedisSessionStorage.del"
        )
      ),
      "should fail if Redis client returns false on deleting the mapping"
    ],
    [
      expectedRedisDelSessionError,
      undefined,
      undefined,
      undefined,
      left(
        multipleErrorsFormatter(
          [
            expectedRedisDelSessionError,
            new Error(
              "Unexpected response from redis client deleting walletToken."
            )
          ],
          "RedisSessionStorage.del"
        )
      ),
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
      expect(mockSrem).not.toBeCalled();

      expect(response).toEqual(expected);
    }
  );
});

describe("RedisSessionStorage#listUserSessions", () => {
  it("should re-init session info and session info set for a user", async () => {
    mockSmembers.mockImplementation((_, callback) => {
      callback(undefined, []);
    });
    mockSet.mockImplementation((_, __, ___, ____, callback) => {
      callback(undefined, "OK");
    });
    mockSadd.mockImplementation((_, __, callback) => {
      callback(undefined, 1);
    });
    const expectedSessionInfo: SessionInfo = {
      createdAt: new Date(),
      sessionToken: aValidUser.session_token
    };
    mockMget.mockImplementation((_, callback) => {
      callback(undefined, [JSON.stringify(expectedSessionInfo)]);
    });
    const response = await sessionStorage.listUserSessions(aValidUser);
    const expectedSessionInfoKey = `SESSIONINFO-${aValidUser.session_token}`;
    expect(mockSet.mock.calls[0][0]).toBe(expectedSessionInfoKey);
    expect(mockSet.mock.calls[0][1]).toBe(JSON.stringify(expectedSessionInfo));
    expect(mockSadd.mock.calls[0][0]).toBe(
      `USERSESSIONS-${aValidUser.fiscal_code}`
    );
    expect(mockSadd.mock.calls[0][1]).toBe(expectedSessionInfoKey);
    expect(response).toEqual(right({ sessions: [expectedSessionInfo] }));
  });

  it("should fails if re-init session info and session info set don't complete", async () => {
    mockSmembers.mockImplementation((_, callback) => {
      callback(undefined, []);
    });
    mockSet.mockImplementation((_, __, ___, ____, callback) => {
      callback(new Error("REDIS ERROR"), undefined);
    });
    const response = await sessionStorage.listUserSessions(aValidUser);
    expect(mockSadd).not.toBeCalled();
    expect(response).toEqual(left(sessionNotFoundError));
  });

  it("should skip a session with invalid value", async () => {
    mockSmembers.mockImplementation((_, callback) => {
      callback(undefined, [`SESSIONINFO-${aValidUser.session_token}`]);
    });

    mockMget.mockImplementation((_, callback) => {
      callback(undefined, [JSON.stringify({ test: "Invalid SessionInfo" })]);
    });

    const response = await sessionStorage.listUserSessions(aValidUser);

    expect(mockMget).toHaveBeenCalledTimes(1);
    expect(mockMget.mock.calls[0][0]).toBe(
      `SESSIONINFO-${aValidUser.session_token}`
    );
    const expectedSessionsList = SessionsList.decode({ sessions: [] });
    expect(response).toEqual(expectedSessionsList);
  });

  it("should skip a session with unparseble value", async () => {
    mockSmembers.mockImplementation((_, callback) => {
      callback(undefined, [`SESSIONINFO-${aValidUser.session_token}`]);
    });

    mockMget.mockImplementation((_, callback) => {
      callback(undefined, ["Invalid JSON value"]);
    });

    const response = await sessionStorage.listUserSessions(aValidUser);

    expect(mockMget).toHaveBeenCalledTimes(1);
    expect(mockMget.mock.calls[0][0]).toBe(
      `SESSIONINFO-${aValidUser.session_token}`
    );
    const expectedSessionsList = SessionsList.decode({ sessions: [] });
    expect(response).toEqual(expectedSessionsList);
  });

  it("should handle expired keys on user tokens set", async () => {
    mockSmembers.mockImplementation((_, callback) => {
      callback(undefined, [
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`
      ]);
    });

    const expectedSessionInfo = SessionInfo.decode({
      createdAt: new Date(),
      sessionToken: aValidUser.session_token
    });
    mockMget.mockImplementationOnce((_, __, callback) => {
      callback(undefined, [JSON.stringify(expectedSessionInfo.value), null]);
    });

    const response = await sessionStorage.listUserSessions(aValidUser);

    expect(mockMget).toHaveBeenCalledTimes(1);
    expect(mockMget.mock.calls[0][0]).toBe(
      `SESSIONINFO-${aValidUser.session_token}`
    );
    expect(mockMget.mock.calls[0][1]).toBe(`SESSIONINFO-expired_session_token`);
    const expectedSessionsList = SessionsList.decode({
      sessions: [expectedSessionInfo.value]
    });
    expect(response).toEqual(expectedSessionsList);
  });
});

describe("RedisSessionStorage#clearExpiredSetValues", () => {
  it("error reading set members", async () => {
    mockSmembers.mockImplementation((_, callback) => {
      callback(new Error("smembers error"), undefined);
    });
    // tslint:disable-next-line: no-string-literal
    const clearResults = await sessionStorage["clearExpiredSetValues"](
      aValidUser.fiscal_code
    );
    expect(clearResults).toEqual([]);
  });
  it("delete expired session key reference from user token set", async () => {
    mockSmembers.mockImplementation((_, callback) => {
      callback(undefined, [
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`
      ]);
    });
    mockExists.mockImplementationOnce((_, callback) => {
      callback(undefined, 1);
    });
    mockExists.mockImplementationOnce((_, callback) => {
      callback(undefined, 0);
    });
    mockSrem.mockImplementation((_, __, callback) => {
      callback(undefined, 1);
    });

    // tslint:disable-next-line: no-string-literal
    const clearResults = await sessionStorage["clearExpiredSetValues"](
      aValidUser.fiscal_code
    );
    expect(mockSmembers).toHaveBeenCalledTimes(1);
    expect(mockSmembers.mock.calls[0][0]).toBe(
      `USERSESSIONS-${aValidUser.fiscal_code}`
    );
    expect(mockExists).toHaveBeenCalledTimes(2);
    expect(mockExists.mock.calls[0][0]).toBe(
      `SESSIONINFO-${aValidUser.session_token}`
    );
    expect(mockExists.mock.calls[1][0]).toBe(
      `SESSIONINFO-expired_session_token`
    );
    expect(mockSrem).toHaveBeenCalledTimes(1);
    expect(mockSrem.mock.calls[0][0]).toBe(
      `USERSESSIONS-${aValidUser.fiscal_code}`
    );
    expect(mockSrem.mock.calls[0][1]).toBe(`SESSIONINFO-expired_session_token`);
    expect(clearResults).toHaveLength(1);
  });
});
