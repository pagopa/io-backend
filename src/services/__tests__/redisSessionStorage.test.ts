/* tslint:disable:no-any */
/* tslint:disable:no-duplicate-string */
/* tslint:disable:no-let */
/* tslint:disable:no-identical-functions */
/* tslint:disable:no-null-keyword */
/* tslint:disable:no-object-mutation */

import { Either, isRight, left, Left, right } from "fp-ts/lib/Either";
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
import {
  BPDToken,
  MyPortalToken,
  SessionToken,
  WalletToken
} from "../../types/token";
import { User, UserV3 } from "../../types/user";
import { multipleErrorsFormatter } from "../../utils/errorsFormatter";
import RedisSessionStorage, {
  sessionNotFoundError
} from "../redisSessionStorage";

// utils that extracts the last argument as callback and calls it
const callCallback = (err: any, value?: any) => (...args: readonly any[]) => {
  const callback = args[args.length - 1];
  return callback(err, value);
};

const aTokenDurationSecs = 3600;
const theCurrentTimestampMillis = 1518010929530;

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
const anInvalidFiscalCode = "INVALID-FC" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
const aSessionToken = "HexToKen" as SessionToken;
const aWalletToken = "HexToKen" as WalletToken;
const aMyportalToken = "HexToKen" as MyPortalToken;
const aBPDToken = "HexToKen" as BPDToken;
// mock for a valid User
const aValidUser: UserV3 = {
  bpd_token: aBPDToken,
  created_at: 1183518855,
  family_name: "Garibaldi",
  fiscal_code: aFiscalCode,
  myportal_token: aMyportalToken,
  name: "Giuseppe Maria",
  session_token: aSessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: aWalletToken
};

// mock for a invalid User
const anInvalidUser: User = {
  ...aValidUser,
  fiscal_code: anInvalidFiscalCode
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
const mockGet = jest.fn().mockImplementation((_, callback) => {
  callback(undefined, JSON.stringify(aValidUser));
});
const mockMget = jest.fn();
const mockDel = jest.fn().mockImplementation(
  // as del() can be can be called with variable arguments number, we extract the last as callback
  callCallback(undefined, 4)
);

const mockSadd = jest.fn();
const mockSrem = jest.fn();
const mockSmembers = jest
  .fn()
  .mockImplementation((_, callback) => callback(null, [aSessionToken]));
const mockExists = jest.fn();
const mockSismember = jest.fn();
const mockTtl = jest.fn();
const mockRedisClient = createMockRedis().createClient();
mockRedisClient.set = mockSet;
mockRedisClient.get = mockGet;
mockRedisClient.mget = mockMget;
mockRedisClient.del = mockDel;
mockRedisClient.sadd = mockSadd;
mockRedisClient.srem = mockSrem;
mockRedisClient.smembers = mockSmembers;
mockRedisClient.exists = mockExists;
mockRedisClient.sismember = mockSismember;
mockRedisClient.ttl = mockTtl;

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

// tslint:disable-next-line: no-big-function
describe("RedisSessionStorage#set", () => {
  it.each([
    [
      undefined,
      "OK",
      undefined,
      "OK",
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
      undefined,
      "OK",
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
      undefined,
      "OK",
      undefined,
      "OK",
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
      undefined,
      "OK",
      undefined,
      "OK",
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
      undefined,
      "OK",
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
      undefined,
      "OK",
      undefined,
      "OK",
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
      undefined,
      "OK",
      undefined,
      "OK",
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
      undefined,
      "OK",
      undefined,
      "OK",
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
      undefined,
      "OK",
      undefined,
      "OK",
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
      undefined,
      "OK",
      undefined,
      "OK",
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
      sessionSetSuccess: string,
      walletSetErr: Error,
      walletSetSuccess: string,
      myPortalSetError: Error,
      myPortalSetSuccess: string,
      bpdSetError: Error,
      bpdSetSuccess: string,
      expected: Error
      // tslint:disable-next-line: parameters-max-number
    ) => {
      mockSet.mockImplementationOnce((_, __, ___, ____, callback) => {
        callback(sessionSetErr, sessionSetSuccess);
      });

      mockSet.mockImplementationOnce((_, __, ___, ____, callback) => {
        callback(walletSetErr, walletSetSuccess);
      });

      mockSet.mockImplementationOnce((_, __, ___, ____, callback) => {
        callback(myPortalSetError, myPortalSetSuccess);
      });

      mockSet.mockImplementationOnce((_, __, ___, ____, callback) => {
        callback(bpdSetError, bpdSetSuccess);
      });

      mockSet.mockImplementationOnce((_, __, ___, ____, callback) => {
        callback(undefined, "OK");
      });

      mockSadd.mockImplementation((_, __, callback) => {
        callback(undefined, 1);
      });

      mockSmembers.mockImplementationOnce((_, callback) => {
        callback(undefined, []);
      });

      const response = await sessionStorage.set(aValidUser);

      expect(mockSet).toHaveBeenCalledTimes(5);

      expect(mockSet.mock.calls[0][0]).toBe(
        `SESSION-${aValidUser.session_token}`
      );
      expect(mockSet.mock.calls[0][1]).toEqual(JSON.stringify(aValidUser));

      expect(mockSet.mock.calls[1][0]).toBe(
        `WALLET-${aValidUser.wallet_token}`
      );
      expect(mockSet.mock.calls[1][1]).toBe(aValidUser.session_token);

      expect(mockSet.mock.calls[2][0]).toBe(
        `MYPORTAL-${aValidUser.myportal_token}`
      );
      expect(mockSet.mock.calls[2][1]).toBe(aValidUser.session_token);

      expect(mockSet.mock.calls[3][0]).toBe(`BPD-${aValidUser.bpd_token}`);
      expect(mockSet.mock.calls[3][1]).toBe(aValidUser.session_token);

      expect(mockSet.mock.calls[4][0]).toBe(
        `SESSIONINFO-${aValidUser.session_token}`
      );
      expect(mockSet.mock.calls[4][1]).toBeDefined();
      expect(JSON.parse(mockSet.mock.calls[4][1])).toHaveProperty("createdAt");
      expect(response).toEqual(expected);
    }
  );
});

describe("RedisSessionStorage#removeOtherUserSessions", () => {
  it("should delete only older session token", async () => {
    const oldSessionToken = "old_session_token" as SessionToken;
    const oldWalletToken = "old_wallet_token" as WalletToken;
    const oldUserPayload: User = {
      ...aValidUser,
      session_token: oldSessionToken,
      wallet_token: oldWalletToken
    };
    const oldUserPayload2: User = {
      ...aValidUser,
      session_token: `${oldSessionToken}2` as SessionToken,
      wallet_token: `${oldWalletToken}2` as WalletToken
    };
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, [
        `SESSIONINFO-${oldUserPayload.session_token}`,
        `SESSIONINFO-${oldUserPayload2.session_token}`,
        `SESSIONINFO-${aValidUser.session_token}`
      ]);
    });
    mockMget.mockImplementation((_, __, callback) => {
      callback(undefined, [
        JSON.stringify(oldUserPayload),
        JSON.stringify(oldUserPayload2)
      ]);
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
    expect(mockDel.mock.calls[0][0]).toBe(
      `SESSION-${oldUserPayload.session_token}`
    );
    expect(mockDel.mock.calls[0][1]).toBe(
      `SESSION-${oldUserPayload2.session_token}`
    );
    expect(mockDel.mock.calls[0][2]).toBe(
      `WALLET-${oldUserPayload.wallet_token}`
    );
    expect(mockDel.mock.calls[0][3]).toBe(
      `WALLET-${oldUserPayload2.wallet_token}`
    );
    expect(response.isRight());
  });
});

describe("RedisSessionStorage#getBySessionToken", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, null);
    });
    const response = await sessionStorage.getBySessionToken(
      "inexistent token" as SessionToken
    );
    expect(response).toEqual(right(none));
  });

  it("should fail getting a session with invalid value", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
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
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, "Invalid JSON");
    });

    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(
      left(new SyntaxError("Unexpected token I in JSON at position 0"))
    );
  });

  it("should return error if the session is expired", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, null);
    });
    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(response).toEqual(right(none));
  });

  it("should get a session with valid values", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
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

describe("RedisSessionStorage#getByMyPortalToken", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, null);
    });
    const response = await sessionStorage.getByMyPortalToken(
      "inexistent token" as MyPortalToken
    );
    expect(response).toEqual(right(none));
  });

  it("should fail getting a session with invalid value", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, aSessionToken);
    });
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, JSON.stringify(anInvalidUser));
    });
    const expectedDecodedError = User.decode(anInvalidUser) as Left<
      ReadonlyArray<ValidationError>,
      User
    >;
    const expectedError = new Error(
      errorsToReadableMessages(expectedDecodedError.value).join("/")
    );
    const response = await sessionStorage.getByMyPortalToken(
      aValidUser.myportal_token
    );

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(
      `MYPORTAL-${aValidUser.myportal_token}`
    );
    expect(mockGet.mock.calls[1][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(left(expectedError));
  });

  it("should fail parse of user payload", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, aSessionToken);
    });
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, "Invalid JSON");
    });

    const response = await sessionStorage.getByMyPortalToken(
      aValidUser.myportal_token
    );

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(
      `MYPORTAL-${aValidUser.myportal_token}`
    );
    expect(mockGet.mock.calls[1][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(
      left(new SyntaxError("Unexpected token I in JSON at position 0"))
    );
  });

  it("should return error if the session is expired", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, null);
    });
    const response = await sessionStorage.getByMyPortalToken(
      aValidUser.myportal_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(response).toEqual(right(none));
  });

  it("should get a session with valid values", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, aSessionToken);
    });
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, JSON.stringify(aValidUser));
    });

    const response = await sessionStorage.getByMyPortalToken(
      aValidUser.myportal_token
    );

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(
      `MYPORTAL-${aValidUser.myportal_token}`
    );
    expect(mockGet.mock.calls[1][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(right(some(aValidUser)));
  });
});

describe("RedisSessionStorage#getByWalletToken", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, null);
    });
    const response = await sessionStorage.getByWalletToken(
      "inexistent token" as WalletToken
    );
    expect(response).toEqual(right(none));
  });

  it("should fail getting a session with invalid value", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, aSessionToken);
    });
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, JSON.stringify(anInvalidUser));
    });
    const expectedDecodedError = User.decode(anInvalidUser) as Left<
      ReadonlyArray<ValidationError>,
      User
    >;
    const expectedError = new Error(
      errorsToReadableMessages(expectedDecodedError.value).join("/")
    );
    const response = await sessionStorage.getByWalletToken(
      aValidUser.wallet_token
    );

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(`WALLET-${aValidUser.wallet_token}`);
    expect(mockGet.mock.calls[1][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(left(expectedError));
  });

  it("should fail parse of user payload", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, aSessionToken);
    });
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, "Invalid JSON");
    });

    const response = await sessionStorage.getByWalletToken(
      aValidUser.wallet_token
    );

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(`WALLET-${aValidUser.wallet_token}`);
    expect(mockGet.mock.calls[1][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(
      left(new SyntaxError("Unexpected token I in JSON at position 0"))
    );
  });

  it("should return error if the session is expired", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, null);
    });
    const response = await sessionStorage.getByWalletToken(
      aValidUser.wallet_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(response).toEqual(right(none));
  });

  it("should get a session with valid values", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, aSessionToken);
    });
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, JSON.stringify(aValidUser));
    });

    const response = await sessionStorage.getByWalletToken(
      aValidUser.wallet_token
    );

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(`WALLET-${aValidUser.wallet_token}`);
    expect(mockGet.mock.calls[1][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(right(some(aValidUser)));
  });
});

// tslint:disable-next-line: no-big-function
describe("RedisSessionStorage#del", () => {
  const expectedRedisDelError = new Error("del error");

  it.each([
    [undefined, 4, right(true), "should delete al user tokens"],
    [
      expectedRedisDelError,
      undefined,
      left(
        new Error(
          `value [${expectedRedisDelError.message}] at RedisSessionStorage.del`
        )
      ),
      "should fail if Redis client returns an error on deleting the user tokens"
    ],
    [
      undefined,
      3,
      left(
        new Error(
          `value [${
            new Error(
              "Unexpected response from redis client deleting user tokens."
            ).message
          }] at RedisSessionStorage.del`
        )
      ),
      "should fail if Redis client returns an error deleting the session and false deleting the mapping"
    ]
  ])(
    "%s, %s",
    async (tokenDelErr: Error, tokenDelResponse: number, expected: Error) => {
      const aValidUserWithExternalTokens = {
        ...aValidUser,
        bpd_token: aBPDToken,
        myportal_token: aMyportalToken
      };
      mockDel.mockImplementationOnce((_, __, ___, ____, callback) => {
        callback(tokenDelErr, tokenDelResponse);
      });

      const response = await sessionStorage.del(
        aValidUserWithExternalTokens.session_token,
        aValidUserWithExternalTokens.wallet_token,
        aValidUserWithExternalTokens.myportal_token,
        aValidUserWithExternalTokens.bpd_token
      );

      expect(mockDel).toHaveBeenCalledTimes(1);
      expect(mockDel.mock.calls[0][0]).toBe(
        `SESSION-${aValidUserWithExternalTokens.session_token}`
      );
      expect(mockDel.mock.calls[0][1]).toBe(
        `WALLET-${aValidUserWithExternalTokens.wallet_token}`
      );
      expect(mockDel.mock.calls[0][2]).toBe(
        `MYPORTAL-${aValidUserWithExternalTokens.myportal_token}`
      );
      expect(mockDel.mock.calls[0][3]).toBe(
        `BPD-${aValidUserWithExternalTokens.bpd_token}`
      );
      expect(mockSrem).not.toBeCalled();

      expect(response).toEqual(expected);
    }
  );
});

describe("RedisSessionStorage#listUserSessions", () => {
  it("should re-init session info and session info set for a user", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => {
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
    mockSmembers.mockImplementationOnce((_, callback) => {
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
    mockSmembers.mockImplementationOnce((_, callback) => {
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
    mockSmembers.mockImplementationOnce((_, callback) => {
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
    mockSmembers.mockImplementationOnce((_, callback) => {
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
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(new Error("smembers error"), undefined);
    });
    // tslint:disable-next-line: no-string-literal
    const clearResults = await sessionStorage["clearExpiredSetValues"](
      aValidUser.fiscal_code
    );
    expect(clearResults).toEqual([]);
  });
  it("delete expired session key reference from user token set", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => {
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

describe("RedisSessionStorage#userHasActiveSessions", () => {
  it("should return true if exists an active user session", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, [
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`
      ]);
    });
    mockMget.mockImplementationOnce((_, __, callback) => {
      callback(null, [
        JSON.stringify({
          createdAt: new Date(),
          sessionToken: aValidUser.session_token
        }),
        JSON.stringify({
          createdAt: new Date(),
          sessionToken: "expired_session_token"
        })
      ]);
    });
    mockMget.mockImplementationOnce((_, __, callback) => {
      callback(null, [JSON.stringify(aValidUser)]);
    });
    const userHasActiveSessionsResult = await sessionStorage.userHasActiveSessions(
      aValidUser.fiscal_code
    );
    expect(isRight(userHasActiveSessionsResult)).toBeTruthy();
    expect(userHasActiveSessionsResult.value).toEqual(true);
  });

  it("should return false if doens't exists an active user session", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, [
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`
      ]);
    });
    mockMget.mockImplementationOnce((_, __, callback) => {
      callback(null, [
        JSON.stringify({
          createdAt: new Date(),
          sessionToken: aValidUser.session_token
        }),
        JSON.stringify({
          createdAt: new Date(),
          sessionToken: "expired_session_token"
        })
      ]);
    });
    mockMget.mockImplementationOnce((_, __, callback) => {
      callback(null, []);
    });
    const userHasActiveSessionsResult = await sessionStorage.userHasActiveSessions(
      aValidUser.fiscal_code
    );
    expect(isRight(userHasActiveSessionsResult)).toBeTruthy();
    expect(userHasActiveSessionsResult.value).toEqual(false);
  });

  it("should return false if doens't exists any session info for the user", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, []);
    });
    const userHasActiveSessionsResult = await sessionStorage.userHasActiveSessions(
      aValidUser.fiscal_code
    );
    expect(isRight(userHasActiveSessionsResult)).toBeTruthy();
    expect(userHasActiveSessionsResult.value).toEqual(false);
  });

  it("should return false if sessions info for a user are missing", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, [
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`
      ]);
    });
    mockMget.mockImplementationOnce((_, __, callback) => {
      callback(null, []);
    });
    const userHasActiveSessionsResult = await sessionStorage.userHasActiveSessions(
      aValidUser.fiscal_code
    );
    expect(isRight(userHasActiveSessionsResult)).toBeTruthy();
    expect(userHasActiveSessionsResult.value).toEqual(false);
  });

  it("should return a left value if a redis call fail", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, [
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`
      ]);
    });
    const expectedRedisError = new Error("Generic Redis Error");
    mockMget.mockImplementationOnce((_, __, callback) => {
      callback(expectedRedisError, undefined);
    });
    const userHasActiveSessionsResult = await sessionStorage.userHasActiveSessions(
      aValidUser.fiscal_code
    );
    expect(isRight(userHasActiveSessionsResult)).toBeFalsy();
    expect(userHasActiveSessionsResult.value).toEqual(expectedRedisError);
  });

  it("should return left value if a redis error occurs searching session info", async () => {
    const expectedRedisError = new Error("Generic Redis Error");
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(expectedRedisError, undefined);
    });
    const userHasActiveSessionsResult = await sessionStorage.userHasActiveSessions(
      aValidUser.fiscal_code
    );
    expect(isRight(userHasActiveSessionsResult)).toBeFalsy();
    expect(userHasActiveSessionsResult.value).toEqual(expectedRedisError);
  });
});

describe("RedisSessionStorage#setBlockedUser", () => {
  it("should return right(true) if the user is correctly locked", async () => {
    mockSadd.mockImplementationOnce((_, __, callback) => callback(null));

    const result = await sessionStorage.setBlockedUser(aFiscalCode);

    expect(result.isRight()).toBeTruthy();
    expect(result.value).toBe(true);
  });

  it("should return left if the user is not correctly locked", async () => {
    const aError = new Error("any error");
    mockSadd.mockImplementationOnce((_, __, callback) => callback(aError));

    const result = await sessionStorage.setBlockedUser(aFiscalCode);

    expect(result.isLeft()).toBeTruthy();
    expect(result.value).toBe(aError);
  });
});

describe("RedisSessionStorage#unsetBlockedUser", () => {
  it("should return right(true) if the user is correctly unlocked", async () => {
    const sremSuccess = 1;
    mockSrem.mockImplementation((_, __, callback) =>
      callback(null, sremSuccess)
    );

    const result = await sessionStorage.unsetBlockedUser(aFiscalCode);

    expect(result.isRight()).toBeTruthy();
    expect(result.value).toBe(true);
  });

  it("should return left(Error) if the user is not correctly unlocked", async () => {
    const sremFailure = 0;
    mockSrem.mockImplementationOnce((_, __, callback) =>
      callback(null, sremFailure)
    );

    const result = await sessionStorage.unsetBlockedUser(aFiscalCode);

    expect(result.isLeft()).toBeTruthy();
    expect(result.value instanceof Error).toBe(true);
  });

  it("should return left if for any unhandled failures", async () => {
    const aError = new Error("any error");
    mockSadd.mockImplementationOnce((_, __, callback) => callback(aError));

    const result = await sessionStorage.setBlockedUser(aFiscalCode);

    expect(result.isLeft()).toBeTruthy();
    expect(result.value).toBe(aError);
  });
});

describe("RedisSessionStorage#delUserAllSessions", () => {
  it("should succeed if user has no session", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => callback(null, []));
    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(result.isRight()).toBeTruthy();
    expect(result.value).toBe(true);
  });

  it("should fail if there's an error retrieving user's sessions", async () => {
    const aError = new Error("any error");
    mockSmembers.mockImplementationOnce((_, callback) => callback(aError));
    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(result.isLeft()).toBeTruthy();
    expect(result.value).toBe(aError);
  });

  it("should fail if the stored user profile is not valid", async () => {
    const invalidProfile = { foo: "bar" };
    mockGet.mockImplementationOnce((_, callback) =>
      callback(null, invalidProfile)
    );

    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(result.isLeft()).toBeTruthy();
    expect(result.value instanceof Error).toBe(true);
  });

  it("should succeed if there's no user stored", async () => {
    mockGet.mockImplementationOnce((_, callback) => callback(null, null));

    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(result.isRight()).toBeTruthy();
    expect(result.value).toBe(true);
  });

  it("should succeed if everything is fine", async () => {
    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(result.isRight()).toBeTruthy();
    expect(result.value).toBe(true);
  });
});
