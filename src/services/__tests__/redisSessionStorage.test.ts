/* tslint:disable:no-any */
/* tslint:disable:no-duplicate-string */
/* tslint:disable:no-let */
/* tslint:disable:no-identical-functions */
/* tslint:disable:no-null-keyword */
/* tslint:disable:no-object-mutation */

import * as E from "fp-ts/lib/Either";

import * as lolex from "lolex";

import * as O from "fp-ts/lib/Option";
import { ValidationError } from "io-ts";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SessionInfo } from "../../../generated/backend/SessionInfo";
import { SessionsList } from "../../../generated/backend/SessionsList";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { MyPortalToken, SessionToken } from "../../types/token";
import { User, UserV5 } from "../../types/user";
import RedisSessionStorage from "../redisSessionStorage";
import {
  mockBPDToken,
  mockFIMSToken,
  mockMyPortalToken,
  mockSessionToken,
  mockWalletToken,
  mockZendeskToken,
} from "../../__mocks__/user_mock";
import { anAssertionRef } from "../../__mocks__/lollipop";
import { LoginTypeEnum } from "../../utils/fastLogin";
import {
  mockDel,
  mockExists,
  mockGet,
  mockRedisClientSelector,
  mockSadd,
  mockSelectOne,
  mockSetEx,
  mockSmembers,
  mockSrem,
  mockTtl,
} from "../../__mocks__/redis";
import { RedisClientMode } from "../../utils/redis";

const theCurrentTimestampMillis = 1518010929530;

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
const anInvalidFiscalCode = "INVALID-FC" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for a valid User
const aValidUser: UserV5 = {
  bpd_token: mockBPDToken,
  created_at: 1183518855,
  date_of_birth: "2002-01-01",
  family_name: "Garibaldi",
  fims_token: mockFIMSToken,
  fiscal_code: aFiscalCode,
  myportal_token: mockMyPortalToken,
  name: "Giuseppe Maria",
  session_token: mockSessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  wallet_token: mockWalletToken,
  zendesk_token: mockZendeskToken,
};

// mock for a invalid User
const anInvalidUser: User = {
  ...aValidUser,
  fiscal_code: anInvalidFiscalCode,
};

mockSetEx.mockImplementation((_, __, ___) => Promise.resolve("OK"));
mockGet.mockImplementation((_) => Promise.resolve(JSON.stringify(aValidUser)));
mockDel.mockImplementation((_) => Promise.resolve(1));
mockSadd.mockImplementation((_, __) => Promise.resolve(1));
mockSrem.mockImplementation((_, __) => Promise.resolve(1));
mockSmembers.mockImplementation((_) => Promise.resolve([mockSessionToken]));

const sessionStorage = new RedisSessionStorage(mockRedisClientSelector);

let clock: any;

const redisMethodImplFromError = (
  mockFunction: jest.Mock<unknown, any>,
  success?: unknown,
  error?: Error
) =>
  mockFunction.mockImplementationOnce(() =>
    error ? Promise.reject(error) : Promise.resolve(success)
  );

beforeEach(() => {
  // We need to mock time to test token expiration.
  clock = lolex.install({ now: theCurrentTimestampMillis });

  jest.clearAllMocks();
});

afterEach(() => {
  clock = clock.uninstall();
});

describe("RedisSessionStorage#getBySessionToken", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve(null));

    const response = await sessionStorage.getBySessionToken(
      "inexistent token" as SessionToken
    );
    expect(response).toEqual(E.right(O.none));
  });

  it("should fail getting a session with invalid value", async () => {
    mockGet.mockImplementationOnce((_) =>
      Promise.resolve(JSON.stringify(anInvalidUser))
    );

    const expectedDecodedError = User.decode(anInvalidUser) as E.Left<
      ReadonlyArray<ValidationError>
    >;
    const expectedError = new Error(
      errorsToReadableMessages(expectedDecodedError.left).join("/")
    );
    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith(`SESSION-${aValidUser.session_token}`);
    expect(response).toEqual(E.left(expectedError));
  });

  it("should fail parse of user payload", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve("Invalid JSON"));

    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith(`SESSION-${aValidUser.session_token}`);
    expect(response).toEqual(
      E.left(new SyntaxError("Unexpected token I in JSON at position 0"))
    );
  });

  it("should return error if the session is expired", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve(null));
    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(response).toEqual(E.right(O.none));
  });

  it("should get a session with valid values", async () => {
    mockGet.mockImplementationOnce((_) =>
      Promise.resolve(JSON.stringify(aValidUser))
    );

    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith(`SESSION-${aValidUser.session_token}`);
    expect(response).toEqual(E.right(O.some(aValidUser)));
  });
});

describe("RedisSessionStorage#getByMyPortalToken", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve(null));

    const response = await sessionStorage.getByMyPortalToken(
      "inexistent token" as MyPortalToken
    );
    expect(response).toEqual(E.right(O.none));
  });

  it("should fail getting a session with invalid value", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve(mockSessionToken));
    mockGet.mockImplementationOnce((_) =>
      Promise.resolve(JSON.stringify(anInvalidUser))
    );
    const expectedDecodedError = User.decode(anInvalidUser) as E.Left<
      ReadonlyArray<ValidationError>
    >;
    const expectedError = new Error(
      errorsToReadableMessages(expectedDecodedError.left).join("/")
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
    expect(response).toEqual(E.left(expectedError));
  });

  it("should fail parse of user payload", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve(mockSessionToken));
    mockGet.mockImplementationOnce((_) => Promise.resolve("Invalid JSON"));

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
      E.left(new SyntaxError("Unexpected token I in JSON at position 0"))
    );
  });

  it("should return error if the session is expired", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve(null));
    const response = await sessionStorage.getByMyPortalToken(
      aValidUser.myportal_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(response).toEqual(E.right(O.none));
  });

  it("should get a session with valid values", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve(mockSessionToken));
    mockGet.mockImplementationOnce((_) =>
      Promise.resolve(JSON.stringify(aValidUser))
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
    expect(response).toEqual(E.right(O.some(aValidUser)));
  });
});

// tslint:disable-next-line: no-big-function
describe("RedisSessionStorage#del", () => {
  const expectedRedisDelError = new Error("del error");

  it.each([
    [undefined, 1, E.right(true), "should delete all user tokens"],
    [
      expectedRedisDelError,
      undefined,
      E.left(
        new Error(
          `value [${expectedRedisDelError.message}] at RedisSessionStorage.del`
        )
      ),
      "should fail if Redis client returns an error on deleting the user tokens",
    ],
    [
      undefined,
      //here we are making integerReplyAsync function fail, even if the DEL operations went fine
      0,
      E.left(
        new Error(
          `value [${
            new Error(
              "Unexpected response from redis client deleting user tokens."
            ).message
          }] at RedisSessionStorage.del`
        )
      ),
      "should fail if Redis client returns an error deleting the session and false deleting the mapping",
    ],
  ])("%s, %s, %s, %s", async (tokenDelErr, tokenDelResponse, expected, _) => {
    const aValidUserWithExternalTokens = {
      ...aValidUser,
      bpd_token: mockBPDToken,
      myportal_token: mockMyPortalToken,
    };
    const expectedSessionInfoKey = `SESSIONINFO-${aValidUserWithExternalTokens.session_token}`;

    for (let i = 0; i < (tokenDelErr == undefined ? 7 : 1); i++)
      redisMethodImplFromError(mockDel, tokenDelResponse, tokenDelErr);

    const response = await sessionStorage.del(aValidUserWithExternalTokens);

    expect(mockDel).toHaveBeenCalledTimes(tokenDelErr == undefined ? 7 : 1);
    if (tokenDelErr == undefined) {
      expect(mockDel).toHaveBeenNthCalledWith(
        1,
        `BPD-${aValidUserWithExternalTokens.bpd_token}`
      );
      expect(mockDel).toHaveBeenNthCalledWith(
        2,
        `FIMS-${aValidUserWithExternalTokens.fims_token}`
      );

      expect(mockDel).toHaveBeenNthCalledWith(
        3,
        `MYPORTAL-${aValidUserWithExternalTokens.myportal_token}`
      );
      expect(mockDel).toHaveBeenNthCalledWith(4, expectedSessionInfoKey);
      expect(mockDel).toHaveBeenNthCalledWith(
        5,
        `SESSION-${aValidUserWithExternalTokens.session_token}`
      );
      expect(mockDel).toHaveBeenNthCalledWith(
        6,
        `WALLET-${aValidUserWithExternalTokens.wallet_token}`
      );
      expect(mockDel).toHaveBeenNthCalledWith(
        7,
        `ZENDESK-${aValidUserWithExternalTokens.zendesk_token}`
      );
    }

    if (E.isRight(expected)) {
      expect(mockSrem).toHaveBeenCalledTimes(1);
      expect(mockSrem).toHaveBeenCalledWith(
        `USERSESSIONS-${aValidUserWithExternalTokens.fiscal_code}`,
        `SESSIONINFO-${aValidUserWithExternalTokens.session_token}`
      );
    } else {
      expect(mockSrem).not.toHaveBeenCalled();
    }
    expect(response).toEqual(expected);
  });
});

describe("RedisSessionStorage#listUserSessions", () => {
  it("should skip a session with invalid value", async () => {
    mockSmembers.mockImplementationOnce((_) =>
      Promise.resolve([`SESSIONINFO-${aValidUser.session_token}`])
    );

    mockExists.mockImplementationOnce((_) => Promise.resolve(1));

    mockSmembers.mockImplementationOnce((_) =>
      Promise.resolve([`SESSIONINFO-${aValidUser.session_token}`])
    );

    mockGet.mockImplementationOnce((_) =>
      Promise.resolve(JSON.stringify({ test: "Invalid SessionInfo" }))
    );

    const response = await sessionStorage.listUserSessions(aValidUser);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith(
      `SESSIONINFO-${aValidUser.session_token}`
    );
    const expectedSessionsList = SessionsList.decode({ sessions: [] });
    expect(response).toEqual(expectedSessionsList);
  });

  it("should skip a session with unparseble value", async () => {
    mockSmembers.mockImplementationOnce((_) =>
      Promise.resolve([`SESSIONINFO-${aValidUser.session_token}`])
    );

    mockExists.mockImplementationOnce((_) => Promise.resolve(1));

    mockSmembers.mockImplementationOnce((_) =>
      Promise.resolve([`SESSIONINFO-${aValidUser.session_token}`])
    );

    mockGet.mockImplementationOnce((_) =>
      Promise.resolve("Invalid JSON value")
    );

    const response = await sessionStorage.listUserSessions(aValidUser);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith(
      `SESSIONINFO-${aValidUser.session_token}`
    );
    const expectedSessionsList = SessionsList.decode({ sessions: [] });
    expect(response).toEqual(expectedSessionsList);
  });

  it("should handle expired keys on user tokens set", async () => {
    mockSmembers.mockImplementationOnce((_) =>
      Promise.resolve([
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`,
      ])
    );

    mockExists.mockImplementationOnce((_) => Promise.resolve(1));

    mockExists.mockImplementationOnce((_) => Promise.resolve(0));

    mockSmembers.mockImplementationOnce((_) =>
      Promise.resolve([`SESSIONINFO-${aValidUser.session_token}`])
    );

    const expectedSessionInfo = SessionInfo.decode({
      createdAt: new Date(),
      sessionToken: aValidUser.session_token,
    });
    expect(E.isRight(expectedSessionInfo)).toBeTruthy();
    if (E.isRight(expectedSessionInfo)) {
      mockGet.mockImplementationOnce((_) =>
        Promise.resolve([JSON.stringify(expectedSessionInfo.right)])
      );

      const response = await sessionStorage.listUserSessions(aValidUser);

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        `SESSIONINFO-${aValidUser.session_token}`
      );
      const expectedSessionsList = SessionsList.decode({
        sessions: [expectedSessionInfo.right],
      });
      expect(response).toEqual(expectedSessionsList);
    }
  });
});

describe("RedisSessionStorage#clearExpiredSetValues", () => {
  it("error reading set members", async () => {
    mockSmembers.mockImplementationOnce((_) =>
      Promise.reject(new Error("smembers error"))
    );
    // tslint:disable-next-line: no-string-literal
    const clearResults = await sessionStorage["clearExpiredSetValues"](
      aValidUser.fiscal_code
    );
    expect(clearResults).toEqual([]);
  });
  it("delete expired session key reference from user token set", async () => {
    mockSmembers.mockImplementationOnce((_) =>
      Promise.resolve([
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`,
      ])
    );

    mockExists.mockImplementationOnce((_) => Promise.resolve(1));

    mockExists.mockImplementationOnce((_) => Promise.resolve(0));

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
    expect(mockSrem).toHaveBeenCalledWith(
      `USERSESSIONS-${aValidUser.fiscal_code}`,
      `SESSIONINFO-expired_session_token`
    );
    expect(clearResults).toHaveLength(1);
  });
});

describe("RedisSessionStorage#userHasActiveSessions", () => {
  it("should return true if exists an active user session", async () => {
    mockSmembers.mockImplementationOnce((_) =>
      Promise.resolve([
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`,
      ])
    );
    mockGet.mockImplementationOnce((_, __) =>
      Promise.resolve(
        JSON.stringify({
          createdAt: new Date(),
          sessionToken: aValidUser.session_token,
        })
      )
    );
    mockGet.mockImplementationOnce((_, __) =>
      Promise.resolve(
        JSON.stringify({
          createdAt: new Date(),
          sessionToken: "expired_session_token",
        })
      )
    );
    mockGet.mockImplementationOnce((_, __) =>
      Promise.resolve(JSON.stringify(aValidUser))
    );
    const userHasActiveSessionsResult =
      await sessionStorage.userHasActiveSessions(aValidUser.fiscal_code);

    expect(mockGet).toHaveBeenNthCalledWith(
      3,
      `SESSION-${aValidUser.session_token}`
    );

    expect(E.isRight(userHasActiveSessionsResult)).toBeTruthy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(true);
    }
  });

  it("should return false if doens't exists an active user session", async () => {
    mockSmembers.mockImplementationOnce((_) =>
      Promise.resolve([
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`,
      ])
    );

    mockGet.mockImplementationOnce((_, __) =>
      Promise.resolve(
        JSON.stringify({
          createdAt: new Date(),
          sessionToken: aValidUser.session_token,
        })
      )
    );
    mockGet.mockImplementationOnce((_, __) =>
      Promise.resolve(
        JSON.stringify({
          createdAt: new Date(),
          sessionToken: "expired_session_token",
        })
      )
    );

    mockGet.mockImplementationOnce((_, __) => Promise.resolve(null));
    mockGet.mockImplementationOnce((_, __) => Promise.resolve(null));

    const userHasActiveSessionsResult =
      await sessionStorage.userHasActiveSessions(aValidUser.fiscal_code);
    expect(E.isRight(userHasActiveSessionsResult)).toBeTruthy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(false);
    }
  });

  it("should return false if doens't exists any session info for the user", async () => {
    mockSmembers.mockImplementationOnce((_) => Promise.resolve([]));

    const userHasActiveSessionsResult =
      await sessionStorage.userHasActiveSessions(aValidUser.fiscal_code);
    expect(E.isRight(userHasActiveSessionsResult)).toBeTruthy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(false);
    }
  });

  it("should return false if sessions info for a user are missing", async () => {
    mockSmembers.mockImplementationOnce((_) =>
      Promise.resolve([
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`,
      ])
    );

    mockGet.mockImplementationOnce((_, __) => Promise.resolve(null));

    const userHasActiveSessionsResult =
      await sessionStorage.userHasActiveSessions(aValidUser.fiscal_code);
    expect(E.isRight(userHasActiveSessionsResult)).toBeTruthy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(false);
    }
  });

  it("should return a left value if a redis call fail", async () => {
    mockSmembers.mockImplementationOnce((_) =>
      Promise.resolve([
        `SESSIONINFO-${aValidUser.session_token}`,
        `SESSIONINFO-expired_session_token`,
      ])
    );

    const expectedRedisError = new Error("Generic Redis Error");
    mockGet.mockImplementationOnce((_, __) =>
      Promise.reject(expectedRedisError)
    );

    const userHasActiveSessionsResult =
      await sessionStorage.userHasActiveSessions(aValidUser.fiscal_code);
    expect(E.isRight(userHasActiveSessionsResult)).toBeFalsy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(expectedRedisError);
    }
  });

  it("should return left value if a redis error occurs searching session info", async () => {
    const expectedRedisError = new Error("Generic Redis Error");

    mockSmembers.mockImplementationOnce((_) =>
      Promise.reject(expectedRedisError)
    );

    const userHasActiveSessionsResult =
      await sessionStorage.userHasActiveSessions(aValidUser.fiscal_code);
    expect(E.isRight(userHasActiveSessionsResult)).toBeFalsy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(expectedRedisError);
    }
  });
});

describe("RedisSessionStorage#userHasActiveSessionsOrLV", () => {
  const lvLollipopData = { a: anAssertionRef, t: LoginTypeEnum.LV };
  const legacyLollipopData = { a: anAssertionRef, t: LoginTypeEnum.LEGACY };

  const expectedRedisError = new Error("Generic Redis Error");

  const expectOnlyLollipopDataIsRetrieved = (cf: FiscalCode) => {
    expect(mockSelectOne).toHaveBeenNthCalledWith(1, RedisClientMode.SAFE);
    expect(mockSelectOne).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenNthCalledWith(1, `KEYS-${cf}`);
    expect(mockSmembers).not.toHaveBeenCalled();
    expect(mockGet).toHaveBeenCalledTimes(1);
  };

  const expectLollipopDataAndSessionInfoAreRetrieved = (
    cf: FiscalCode,
    sessionToken: string
  ) => {
    expect(mockSelectOne).toHaveBeenNthCalledWith(1, RedisClientMode.SAFE);
    expect(mockGet).toHaveBeenNthCalledWith(1, `KEYS-${cf}`);
    expect(mockSmembers).toHaveBeenCalledWith(`USERSESSIONS-${cf}`);
    expect(mockGet).toHaveBeenNthCalledWith(2, `SESSIONINFO-${sessionToken}`);
  };

  it("should return true if login type is LV", async () => {
    mockGet.mockImplementationOnce(async (_, __) =>
      JSON.stringify(lvLollipopData)
    );

    const result = await sessionStorage.userHasActiveSessionsOrLV(
      aValidUser.fiscal_code
    );
    expect(result).toEqual(E.right(true));

    expectOnlyLollipopDataIsRetrieved(aValidUser.fiscal_code);
  });

  it("should return true if login type is LEGACY and user has an active session", async () => {
    mockGet.mockImplementationOnce(async (_, __) =>
      JSON.stringify(legacyLollipopData)
    );
    mockSmembers.mockImplementationOnce(async (_) => [
      `SESSIONINFO-${aValidUser.session_token}`,
    ]);
    mockGet.mockImplementationOnce(async (_, __) =>
      JSON.stringify({
        createdAt: new Date(),
        sessionToken: aValidUser.session_token,
      })
    );
    mockGet.mockImplementationOnce(async (_, __) => JSON.stringify(aValidUser));

    const result = await sessionStorage.userHasActiveSessionsOrLV(
      aValidUser.fiscal_code
    );
    expect(result).toEqual(E.right(true));

    expectLollipopDataAndSessionInfoAreRetrieved(
      aValidUser.fiscal_code,
      aValidUser.session_token
    );
    expect(mockSelectOne).toHaveBeenCalledTimes(4);
  });

  it("should return false if no LollipopData was found", async () => {
    mockGet.mockImplementationOnce(async (_, __) => null);

    const result = await sessionStorage.userHasActiveSessionsOrLV(
      aValidUser.fiscal_code
    );
    expect(result).toEqual(E.right(false));

    expectOnlyLollipopDataIsRetrieved(aValidUser.fiscal_code);
  });

  it("should return false if login type is LEGACY, USERSESSION is defined but user has no active sessions", async () => {
    mockGet.mockImplementationOnce(async (_, __) =>
      JSON.stringify({ a: anAssertionRef, t: LoginTypeEnum.LEGACY })
    );
    mockSmembers.mockImplementationOnce(async (_) => [
      `SESSIONINFO-${aValidUser.session_token}`,
    ]);

    mockGet.mockImplementationOnce(() => Promise.resolve(null));

    const result = await sessionStorage.userHasActiveSessionsOrLV(
      aValidUser.fiscal_code
    );
    expect(result).toEqual(E.right(false));

    expectLollipopDataAndSessionInfoAreRetrieved(
      aValidUser.fiscal_code,
      aValidUser.session_token
    );
    expect(mockSelectOne).toHaveBeenCalledTimes(3);
  });

  it("should return false if login type is LEGACY and user has no active sessions", async () => {
    mockGet.mockImplementationOnce(async (_, __) =>
      JSON.stringify(legacyLollipopData)
    );
    mockSmembers.mockImplementationOnce(async (_) => []);

    const result = await sessionStorage.userHasActiveSessionsOrLV(
      aValidUser.fiscal_code
    );
    expect(result).toEqual(E.right(false));

    expect(mockSelectOne).toHaveBeenNthCalledWith(1, RedisClientMode.SAFE);
    expect(mockGet).toHaveBeenNthCalledWith(
      1,
      `KEYS-${aValidUser.fiscal_code}`
    );
    expect(mockSmembers).toHaveBeenCalledWith(
      `USERSESSIONS-${aValidUser.fiscal_code}`
    );
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockSelectOne).toHaveBeenCalledTimes(2);
  });

  it("should return a left value if a redis call fail in getLollipopDataForUser", async () => {
    mockGet.mockImplementationOnce((_, __) =>
      Promise.reject(expectedRedisError)
    );

    const result = await sessionStorage.userHasActiveSessionsOrLV(
      aValidUser.fiscal_code
    );
    expect(mockSelectOne).toHaveBeenNthCalledWith(1, RedisClientMode.SAFE);
    expect(mockSelectOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual(E.left(expectedRedisError));
  });

  it("should return a left value if a redis call fail in userHasActiveSessions", async () => {
    mockGet.mockImplementationOnce(async (_, __) =>
      JSON.stringify({ a: anAssertionRef, t: LoginTypeEnum.LEGACY })
    );

    mockGet.mockImplementationOnce((_, __) =>
      Promise.reject(expectedRedisError)
    );

    const result = await sessionStorage.userHasActiveSessionsOrLV(
      aValidUser.fiscal_code
    );
    expect(mockSelectOne).toHaveBeenNthCalledWith(1, RedisClientMode.SAFE);
    expect(mockSelectOne).toHaveBeenCalledTimes(3);
    expect(result).toEqual(E.left(expectedRedisError));
  });
});

describe("RedisSessionStorage#setBlockedUser", () => {
  it("should return E.right(true) if the user is correctly locked", async () => {
    mockSadd.mockImplementationOnce((_, __) => Promise.resolve());

    const result = await sessionStorage.setBlockedUser(aFiscalCode);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBe(true);
    }
  });

  it("should return left if the user is not correctly locked", async () => {
    const aError = new Error("any error");
    mockSadd.mockImplementationOnce((_, __) => Promise.reject(aError));

    const result = await sessionStorage.setBlockedUser(aFiscalCode);

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBe(aError);
    }
  });
});

describe("RedisSessionStorage#unsetBlockedUser", () => {
  it("should return E.right(true) if the user is correctly unlocked", async () => {
    const result = await sessionStorage.unsetBlockedUser(aFiscalCode);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBe(true);
    }
  });

  it("should return E.left(Error) if the user is not correctly unlocked", async () => {
    const sremFailure = 0;
    mockSrem.mockImplementationOnce((_, __) => Promise.resolve(sremFailure));

    const result = await sessionStorage.unsetBlockedUser(aFiscalCode);

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left instanceof Error).toBe(true);
    }
  });

  it("should return left if for any unhandled failures", async () => {
    const aError = new Error("any error");
    mockSadd.mockImplementationOnce((_, __) => Promise.reject(aError));

    const result = await sessionStorage.setBlockedUser(aFiscalCode);

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBe(aError);
    }
  });
});

describe("RedisSessionStorage#delUserAllSessions", () => {
  it("should succeed if user has no session", async () => {
    mockSmembers.mockImplementationOnce((_) => Promise.resolve([]));
    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBe(true);
    }
  });

  it("should fail if there's an error retrieving user's sessions", async () => {
    const aError = new Error("any error");
    mockSmembers.mockImplementationOnce((_) => Promise.reject(aError));
    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBe(aError);
    }
  });

  it("should fail if the stored user profile is not valid", async () => {
    const invalidProfile = { foo: "bar" };
    mockGet.mockImplementationOnce((_) => Promise.resolve(invalidProfile));

    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left instanceof Error).toBe(true);
    }
  });

  it("should succeed if there's no user stored", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve());

    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBe(true);
    }
  });

  it("should succeed if everything is fine", async () => {
    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBe(true);
    }
  });
});

describe("RedisSessionStorage#delPagoPaNoticeEmail", () => {
  it("should succeded deleting a notice email", async () => {
    mockDel.mockImplementationOnce((_) => Promise.resolve(1));

    const response = await sessionStorage.delPagoPaNoticeEmail(aValidUser);
    expect(response).toEqual(E.right(true));
  });

  it("should fail deleting a notice email", async () => {
    const expectedError = new Error("Redis Error");

    mockDel.mockImplementationOnce((_) => Promise.reject(expectedError));

    const response = await sessionStorage.delPagoPaNoticeEmail(aValidUser);
    expect(response).toEqual(E.left(expectedError));
  });
});

describe("RedisSessionStorage#getLollipopAssertionRefForUser", () => {
  it("should success and return an assertionRef", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve(anAssertionRef));
    const response = await sessionStorage.getLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);

    expect(response).toEqual(E.right(O.some(anAssertionRef)));
  });

  it("should success and return an assertionRef, if data is stored in new format", async () => {
    mockGet.mockImplementationOnce((_) =>
      Promise.resolve(
        JSON.stringify({ a: anAssertionRef, t: LoginTypeEnum.LEGACY })
      )
    );
    const response = await sessionStorage.getLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);

    expect(response).toEqual(E.right(O.some(anAssertionRef)));
  });

  it("should success and return none if assertionRef is missing", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve(null));
    const response = await sessionStorage.getLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response)) expect(O.isNone(response.right)).toBeTruthy();
  });
  it("should fail with a left response if an error occurs on redis", async () => {
    const expectedError = new Error("redis Error");
    mockGet.mockImplementationOnce((_) => Promise.reject(expectedError));
    const response = await sessionStorage.getLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);
    expect(E.isLeft(response)).toBeTruthy();
    if (E.isLeft(response)) expect(response.left).toEqual(expectedError);
  });

  it("should fail with a left response if the value stored is invalid", async () => {
    mockGet.mockImplementationOnce((_) => Promise.resolve("an invalid value"));
    const response = await sessionStorage.getLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);
    expect(E.isLeft(response)).toBeTruthy();
  });
});

describe("RedisSessionStorage#delLollipopDataForUser", () => {
  it("should return a right either with true value on success", async () => {
    mockDel.mockImplementationOnce((_) => Promise.resolve(1));
    const response = await sessionStorage.delLollipopDataForUser(
      aValidUser.fiscal_code
    );

    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response)) expect(response.right).toEqual(true);
  });

  it("should fail with a left response if an error occurs on redis", async () => {
    const expectedError = new Error("redis Error");
    mockDel.mockImplementationOnce((_) => Promise.reject(expectedError));
    const response = await sessionStorage.delLollipopDataForUser(
      aValidUser.fiscal_code
    );

    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);
    expect(E.isLeft(response)).toBeTruthy();
    if (E.isLeft(response)) expect(response.left).toEqual(expectedError);
  });

  it("should success if no element are removed from redis", async () => {
    mockDel.mockImplementationOnce((_) => Promise.resolve(0));
    const response = await sessionStorage.delLollipopDataForUser(
      aValidUser.fiscal_code
    );

    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response)) expect(response.right).toEqual(true);
  });
});

describe("RedisSessionStorage#getSessionRemaningTTL", () => {
  it("should return the remining TTL of a session", async () => {
    const expectedTtl = 1000;
    mockTtl.mockImplementationOnce((_) => Promise.resolve(expectedTtl));
    mockGet.mockImplementationOnce((_) => Promise.resolve(anAssertionRef));
    const response = await sessionStorage.getSessionRemainingTTL(
      aValidUser.fiscal_code
    )();
    expect(mockTtl).toHaveBeenCalledTimes(1);
    expect(mockTtl).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response))
      expect(response.right).toEqual(
        O.some({
          ttl: expectedTtl,
          type: LoginTypeEnum.LEGACY,
        })
      );
  });

  it("should return none if no CF-AssertionRef ref exists in redis", async () => {
    const expectedTtl = -2;
    mockTtl.mockImplementationOnce((_) => Promise.resolve(expectedTtl));
    const response = await sessionStorage.getSessionRemainingTTL(
      aValidUser.fiscal_code
    )();
    expect(mockTtl).toHaveBeenCalledTimes(1);
    expect(mockTtl).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);
    expect(mockGet).not.toBeCalled();
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response)) expect(response.right).toEqual(O.none);
  });

  it("should return an error if exists a CF-AssertionRef without a TTL", async () => {
    const expectedTtl = -1;
    mockTtl.mockImplementationOnce((_) => Promise.resolve(expectedTtl));
    const response = await sessionStorage.getSessionRemainingTTL(
      aValidUser.fiscal_code
    )();
    expect(mockTtl).toHaveBeenCalledTimes(1);
    expect(mockTtl).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);
    expect(mockGet).not.toBeCalled();
    expect(E.isLeft(response)).toBeTruthy();
  });

  it("should return an error if we retrieve a TTL but we can't retrieve the value", async () => {
    const expectedTtl = 1000;
    mockTtl.mockImplementationOnce((_) => Promise.resolve(expectedTtl));
    mockGet.mockImplementationOnce((_) => Promise.resolve(null));
    const response = await sessionStorage.getSessionRemainingTTL(
      aValidUser.fiscal_code
    )();
    expect(mockTtl).toHaveBeenCalledTimes(1);
    expect(mockTtl).toBeCalledWith(`KEYS-${aValidUser.fiscal_code}`);
    expect(E.isLeft(response)).toBeTruthy();
  });
});
