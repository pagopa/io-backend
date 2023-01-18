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
import {
  BPDToken,
  MyPortalToken,
  SessionToken,
  WalletToken,
  ZendeskToken
} from "../../types/token";
import { User, UserV2, UserV3, UserV4, UserV5 } from "../../types/user";
import { multipleErrorsFormatter } from "../../utils/errorsFormatter";
import RedisSessionStorage, {
  sessionNotFoundError
} from "../redisSessionStorage";
import {
  mockBPDToken,
  mockFIMSToken,
  mockMyPortalToken,
  mockSessionToken,
  mockWalletToken,
  mockZendeskToken
} from "../../__mocks__/user_mock";
import { Second } from "@pagopa/ts-commons/lib/units";
import { anAssertionRef } from "../../__mocks__/lollipop";
import { RedisClientType } from "redis";

// utils that extracts the last argument as callback and calls it
const callCallback = (err: any, value?: any) => (...args: readonly any[]) => {
  const callback = args[args.length - 1];
  return callback(err, value);
};

const aTokenDurationSecs = 3600;
const aDefaultLollipopAssertionRefDurationSec = (3600 * 24 * 365 * 2) as Second;
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
  zendesk_token: mockZendeskToken
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
const mockGet = jest
  .fn()
  .mockImplementation(_ => Promise.resolve(JSON.stringify(aValidUser)));
const mockMget = jest.fn();
const mockDel = jest.fn().mockImplementation(
  // as del() can be can be called with variable arguments number, we extract the last as callback
  _ => Promise.resolve(7)
);

const mockSadd = jest.fn();
const mockSrem = jest.fn();
const mockSmembers = jest
  .fn()
  .mockImplementation(_ => Promise.resolve([mockSessionToken]));
const mockExists = jest.fn();
const mockSismember = jest.fn();
const mockTtl = jest.fn();

const mockRedisClient = ({
  set: mockSet,
  setEx: mockSet,
  get: mockGet,
  mGet: mockMget,
  del: mockDel,
  sAdd: mockSadd,
  sRem: mockSrem,
  sMembers: mockSmembers,
  exists: mockExists,
  sIsMember: mockSismember,
  ttl: mockTtl
} as unknown) as RedisClientType;

const sessionStorage = new RedisSessionStorage(
  mockRedisClient,
  aTokenDurationSecs,
  aDefaultLollipopAssertionRefDurationSec
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
      undefined,
      "OK",
      E.right(true),
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
      undefined,
      "OK",
      E.left(
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
      undefined,
      "OK",
      E.left(
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
      undefined,
      "OK",
      E.left(
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
      undefined,
      "OK",
      E.left(
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
      undefined,
      "OK",
      E.left(
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
      undefined,
      "OK",
      E.left(
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
      undefined,
      "OK",
      E.left(
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
      undefined,
      "OK",
      E.left(
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
      undefined,
      "OK",
      E.left(
        multipleErrorsFormatter(
          [new Error("hmset error"), new Error("Error setting wallet token")],
          "RedisSessionStorage.set"
        )
      ),
      "should fail if Redis client returns false on saving the mapping and error saving the session"
    ]
  ])(
    "%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
    async (
      sessionSetErr,
      sessionSetSuccess,
      walletSetErr,
      walletSetSuccess,
      myPortalSetError,
      myPortalSetSuccess,
      bpdSetError,
      bpdSetSuccess,
      zendeskSetError,
      zendeskSetSuccess,
      expected,
      _
      // tslint:disable-next-line: parameters-max-number
    ) => {
      const redisMethodImplFromError = (
        mockFunction: jest.Mock<unknown, any>,
        success?: unknown,
        error?: Error
      ) =>
        mockFunction.mockImplementationOnce(() =>
          error ? Promise.reject(error) : Promise.resolve(success)
        );

      redisMethodImplFromError(mockSet, sessionSetSuccess, sessionSetErr);
      redisMethodImplFromError(mockSet, walletSetSuccess, walletSetErr);
      redisMethodImplFromError(mockSet, myPortalSetSuccess, myPortalSetError);
      redisMethodImplFromError(mockSet, bpdSetSuccess, bpdSetError);
      redisMethodImplFromError(mockSet, zendeskSetSuccess, zendeskSetError);

      // FIMS Token
      redisMethodImplFromError(mockSet, "OK");
      redisMethodImplFromError(mockSet, "OK");
      redisMethodImplFromError(mockSadd, 1);
      redisMethodImplFromError(mockSmembers, []);

      const response = await sessionStorage.set(aValidUser);

      expect(mockSet).toHaveBeenCalledTimes(7);

      expect(mockSet.mock.calls[0][0]).toBe(
        `SESSION-${aValidUser.session_token}`
      );
      expect(mockSet.mock.calls[0][2]).toEqual(JSON.stringify(aValidUser));

      expect(mockSet.mock.calls[1][0]).toBe(
        `WALLET-${aValidUser.wallet_token}`
      );
      expect(mockSet.mock.calls[1][2]).toBe(aValidUser.session_token);

      expect(mockSet.mock.calls[2][0]).toBe(
        `MYPORTAL-${aValidUser.myportal_token}`
      );
      expect(mockSet.mock.calls[2][2]).toBe(aValidUser.session_token);

      expect(mockSet.mock.calls[3][0]).toBe(`BPD-${aValidUser.bpd_token}`);
      expect(mockSet.mock.calls[3][2]).toBe(aValidUser.session_token);

      expect(mockSet.mock.calls[4][0]).toBe(
        `ZENDESK-${aValidUser.zendesk_token}`
      );
      expect(mockSet.mock.calls[4][2]).toBe(aValidUser.session_token);

      expect(mockSet.mock.calls[6][0]).toBe(
        `SESSIONINFO-${aValidUser.session_token}`
      );
      expect(mockSet.mock.calls[6][2]).toBeDefined();
      expect(JSON.parse(mockSet.mock.calls[6][2])).toHaveProperty("createdAt");
      expect(response).toEqual(expected);
    }
  );
});

describe("RedisSessionStorage#removeOtherUserSessions", () => {
  beforeAll(() => {
    jest
      .spyOn(RedisSessionStorage.prototype, "clearExpiredSetValues")
      .mockImplementation(() =>
        Promise.resolve<ReadonlyArray<E.Either<Error, boolean>>>([
          E.right(true)
        ])
      );
  });
  afterAll(() => {
    jest
      .spyOn(RedisSessionStorage.prototype, "clearExpiredSetValues")
      .mockRestore();
  });
  it("should delete only older session token", async () => {
    const oldSessionToken = "old_session_token" as SessionToken;
    const oldWalletToken = "old_wallet_token" as WalletToken;
    const oldUserPayload: User = {
      ...aValidUser,
      session_token: `${oldSessionToken}1` as SessionToken,
      wallet_token: `${oldWalletToken}1` as WalletToken
    };
    const oldUserPayload2: User = {
      ...aValidUser,
      session_token: `${oldSessionToken}2` as SessionToken,
      wallet_token: `${oldWalletToken}2` as WalletToken
    };
    mockSmembers.mockImplementationOnce(_ =>
      Promise.resolve([
        `SESSIONINFO-${oldUserPayload.session_token}`,
        `SESSIONINFO-${oldUserPayload2.session_token}`,
        `SESSIONINFO-${aValidUser.session_token}`
      ])
    );
    mockMget.mockImplementation((_, __) =>
      Promise.resolve([
        JSON.stringify(oldUserPayload),
        JSON.stringify(oldUserPayload2)
      ])
    );

    const response: E.Either<Error, boolean> = await sessionStorage[
      // tslint:disable-next-line: no-string-literal
      "removeOtherUserSessions"
    ](aValidUser);

    expect(mockSmembers).toHaveBeenCalledTimes(1);
    expect(mockSmembers).toHaveBeenCalledWith(
      `USERSESSIONS-${aValidUser.fiscal_code}`
    );
    expect(mockDel).toHaveBeenCalledTimes(1);
    //this also checks the order of the elements
    expect(mockDel).toHaveBeenCalledWith([
      `SESSIONINFO-${oldUserPayload.session_token}`,
      `SESSIONINFO-${oldUserPayload2.session_token}`,
      `SESSION-${oldUserPayload.session_token}`,
      `SESSION-${oldUserPayload2.session_token}`,
      `WALLET-${oldUserPayload.wallet_token}`,
      `WALLET-${oldUserPayload2.wallet_token}`
    ]);
    expect(E.isRight(response));
  });

  it("should delete only older session token for UserV4 and UserV3 payload", async () => {
    const oldSessionToken = "old_session_token" as SessionToken;
    const oldWalletToken = "old_wallet_token" as WalletToken;
    const oldMyPortalToken = "old_myportal_token" as MyPortalToken;
    const oldBPDToken = "old_bpd_token" as BPDToken;
    const oldZendeskToken = "old_zendesk_token" as ZendeskToken;

    const oldUserPayload: UserV4 = {
      ...aValidUser,
      bpd_token: oldBPDToken,
      myportal_token: oldMyPortalToken,
      session_token: oldSessionToken,
      wallet_token: oldWalletToken,
      zendesk_token: oldZendeskToken
    };

    const oldUserPayload2: UserV3 = {
      ...aValidUser,
      bpd_token: `${oldBPDToken}2` as BPDToken,
      myportal_token: `${oldMyPortalToken}2` as MyPortalToken,
      session_token: `${oldSessionToken}2` as SessionToken,
      wallet_token: `${oldWalletToken}2` as WalletToken
    };

    mockSmembers.mockImplementationOnce(_ =>
      Promise.resolve([
        `SESSIONINFO-${oldUserPayload.session_token}`,
        `SESSIONINFO-${oldUserPayload2.session_token}`,
        `SESSIONINFO-${aValidUser.session_token}`
      ])
    );

    mockMget.mockImplementation((_, __) =>
      Promise.resolve([
        JSON.stringify(oldUserPayload),
        JSON.stringify(oldUserPayload2)
      ])
    );

    const response: E.Either<Error, boolean> = await sessionStorage[
      // tslint:disable-next-line: no-string-literal
      "removeOtherUserSessions"
    ](aValidUser);

    expect(mockSmembers).toHaveBeenCalledTimes(1);
    expect(mockSmembers).toHaveBeenCalledWith(
      `USERSESSIONS-${aValidUser.fiscal_code}`
    );
    expect(mockDel).toHaveBeenCalledTimes(1);
    //this also checks the order of the elements
    expect(mockDel).toHaveBeenCalledWith([
      `SESSIONINFO-${oldUserPayload.session_token}`,
      `SESSIONINFO-${oldUserPayload2.session_token}`,
      `SESSION-${oldUserPayload.session_token}`,
      `SESSION-${oldUserPayload2.session_token}`,
      `BPD-${oldUserPayload.bpd_token}`,
      `MYPORTAL-${oldUserPayload.myportal_token}`,
      `WALLET-${oldUserPayload.wallet_token}`,
      `ZENDESK-${oldUserPayload.zendesk_token}`,
      `BPD-${oldUserPayload2.bpd_token}`,
      `MYPORTAL-${oldUserPayload2.myportal_token}`,
      `WALLET-${oldUserPayload2.wallet_token}`
    ]);
    expect(E.isRight(response));
  });

  it("should delete only older session token for UserV3 and UserV2 payload", async () => {
    const oldSessionToken = "old_session_token" as SessionToken;
    const oldWalletToken = "old_wallet_token" as WalletToken;
    const oldMyPortalToken = "old_myportal_token" as MyPortalToken;
    const oldBPDToken = "old_bpd_token" as BPDToken;
    const oldUserPayload: UserV3 = {
      ...aValidUser,
      bpd_token: oldBPDToken,
      myportal_token: oldMyPortalToken,
      session_token: oldSessionToken,
      wallet_token: oldWalletToken
    };
    const oldUserPayload2: UserV2 = {
      ...aValidUser,
      myportal_token: `${oldMyPortalToken}2` as MyPortalToken,
      session_token: `${oldSessionToken}2` as SessionToken,
      wallet_token: `${oldWalletToken}2` as WalletToken
    };
    mockSmembers.mockImplementationOnce(_ =>
      Promise.resolve([
        `SESSIONINFO-${oldUserPayload.session_token}`,
        `SESSIONINFO-${oldUserPayload2.session_token}`,
        `SESSIONINFO-${aValidUser.session_token}`
      ])
    );
    mockMget.mockImplementation((_, __) =>
      Promise.resolve([
        JSON.stringify(oldUserPayload),
        JSON.stringify(oldUserPayload2)
      ])
    );

    const response: E.Either<Error, boolean> = await sessionStorage[
      // tslint:disable-next-line: no-string-literal
      "removeOtherUserSessions"
    ](aValidUser);
    expect(mockSmembers).toHaveBeenCalledTimes(1);
    expect(mockSmembers).toHaveBeenCalledWith(
      `USERSESSIONS-${aValidUser.fiscal_code}`
    );
    expect(mockDel).toHaveBeenCalledTimes(1);
    //this also checks the order of the elements
    expect(mockDel).toHaveBeenCalledWith([
      `SESSIONINFO-${oldUserPayload.session_token}`,

      `SESSIONINFO-${oldUserPayload2.session_token}`,
      `SESSION-${oldUserPayload.session_token}`,
      `SESSION-${oldUserPayload2.session_token}`,
      `BPD-${oldUserPayload.bpd_token}`,
      `MYPORTAL-${oldUserPayload.myportal_token}`,
      `WALLET-${oldUserPayload.wallet_token}`,
      `MYPORTAL-${oldUserPayload2.myportal_token}`,
      `WALLET-${oldUserPayload2.wallet_token}`
    ]);
    expect(E.isRight(response));
  });
});

describe("RedisSessionStorage#getBySessionToken", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockGet.mockImplementationOnce(_ => Promise.resolve(null));

    const response = await sessionStorage.getBySessionToken(
      "inexistent token" as SessionToken
    );
    expect(response).toEqual(E.right(O.none));
  });

  it("should fail getting a session with invalid value", async () => {
    mockGet.mockImplementationOnce(_ =>
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
    mockGet.mockImplementationOnce(_ => Promise.resolve("Invalid JSON"));

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
    mockGet.mockImplementationOnce(_ => Promise.resolve(null));
    const response = await sessionStorage.getBySessionToken(
      aValidUser.session_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(response).toEqual(E.right(O.none));
  });

  it("should get a session with valid values", async () => {
    mockGet.mockImplementationOnce(_ =>
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
    mockGet.mockImplementationOnce(_ => Promise.resolve(null));

    const response = await sessionStorage.getByMyPortalToken(
      "inexistent token" as MyPortalToken
    );
    expect(response).toEqual(E.right(O.none));
  });

  it("should fail getting a session with invalid value", async () => {
    mockGet.mockImplementationOnce(_ => Promise.resolve(mockSessionToken));
    mockGet.mockImplementationOnce(_ =>
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
    mockGet.mockImplementationOnce(_ => Promise.resolve(mockSessionToken));
    mockGet.mockImplementationOnce(_ => Promise.resolve("Invalid JSON"));

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
    mockGet.mockImplementationOnce(_ => Promise.resolve(null));
    const response = await sessionStorage.getByMyPortalToken(
      aValidUser.myportal_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(response).toEqual(E.right(O.none));
  });

  it("should get a session with valid values", async () => {
    mockGet.mockImplementationOnce(_ => Promise.resolve(mockSessionToken));
    mockGet.mockImplementationOnce(_ =>
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

describe("RedisSessionStorage#getByWalletToken", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockGet.mockImplementationOnce(_ => Promise.resolve(null));

    const response = await sessionStorage.getByWalletToken(
      "inexistent token" as WalletToken
    );
    expect(response).toEqual(E.right(O.none));
  });

  it("should fail getting a session with invalid value", async () => {
    mockGet.mockImplementationOnce(_ => Promise.resolve(mockSessionToken));

    mockGet.mockImplementationOnce(_ =>
      Promise.resolve(JSON.stringify(anInvalidUser))
    );

    const expectedDecodedError = User.decode(anInvalidUser) as E.Left<
      ReadonlyArray<ValidationError>
    >;
    const expectedError = new Error(
      errorsToReadableMessages(expectedDecodedError.left).join("/")
    );
    const response = await sessionStorage.getByWalletToken(
      aValidUser.wallet_token
    );

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(`WALLET-${aValidUser.wallet_token}`);
    expect(mockGet.mock.calls[1][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(E.left(expectedError));
  });

  it("should fail parse of user payload", async () => {
    mockGet.mockImplementationOnce(_ => Promise.resolve(mockSessionToken));
    mockGet.mockImplementationOnce(_ => Promise.resolve("Invalid JSON"));

    const response = await sessionStorage.getByWalletToken(
      aValidUser.wallet_token
    );

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(`WALLET-${aValidUser.wallet_token}`);
    expect(mockGet.mock.calls[1][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(
      E.left(new SyntaxError("Unexpected token I in JSON at position 0"))
    );
  });

  it("should return error if the session is expired", async () => {
    mockGet.mockImplementationOnce(_ => Promise.resolve(null));

    const response = await sessionStorage.getByWalletToken(
      aValidUser.wallet_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(response).toEqual(E.right(O.none));
  });

  it("should get a session with valid values", async () => {
    mockGet.mockImplementationOnce(_ => Promise.resolve(mockSessionToken));

    mockGet.mockImplementationOnce(_ =>
      Promise.resolve(JSON.stringify(aValidUser))
    );

    const response = await sessionStorage.getByWalletToken(
      aValidUser.wallet_token
    );

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(`WALLET-${aValidUser.wallet_token}`);
    expect(mockGet.mock.calls[1][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(E.right(O.some(aValidUser)));
  });
});

describe("RedisSessionStorage#getByZendeskToken", () => {
  it("should fail getting a session for an inexistent token", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, null);
    });
    const response = await sessionStorage.getByZendeskToken(
      "inexistent token" as ZendeskToken
    );
    expect(response).toEqual(E.right(O.none));
  });

  it("should fail getting a session with invalid value", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, mockSessionToken);
    });
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, JSON.stringify(anInvalidUser));
    });
    const expectedDecodedError = User.decode(anInvalidUser);
    expect(E.isLeft(expectedDecodedError)).toBeTruthy();
    if (E.isLeft(expectedDecodedError)) {
      const expectedError = new Error(
        errorsToReadableMessages(expectedDecodedError.left).join("/")
      );
      const response = await sessionStorage.getByZendeskToken(
        aValidUser.zendesk_token
      );

      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet.mock.calls[0][0]).toBe(
        `ZENDESK-${aValidUser.zendesk_token}`
      );
      expect(mockGet.mock.calls[1][0]).toBe(
        `SESSION-${aValidUser.session_token}`
      );
      expect(response).toEqual(E.left(expectedError));
    }
  });

  it("should fail parse of user payload", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, mockSessionToken);
    });
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, "Invalid JSON");
    });

    const response = await sessionStorage.getByZendeskToken(
      aValidUser.zendesk_token
    );

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(
      `ZENDESK-${aValidUser.zendesk_token}`
    );
    expect(mockGet.mock.calls[1][0]).toBe(
      `SESSION-${aValidUser.session_token}`
    );
    expect(response).toEqual(
      E.left(new SyntaxError("Unexpected token I in JSON at position 0"))
    );
  });

  it("should return error if the session is expired", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, null);
    });
    const response = await sessionStorage.getByZendeskToken(
      aValidUser.zendesk_token
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(response).toEqual(E.right(O.none));
  });

  it("should get a session with valid values", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, mockSessionToken);
    });
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, JSON.stringify(aValidUser));
    });

    const response = await sessionStorage.getByZendeskToken(
      aValidUser.zendesk_token
    );

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(
      `ZENDESK-${aValidUser.zendesk_token}`
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
    [undefined, 7, E.right(true), "should delete al user tokens"],
    [
      expectedRedisDelError,
      undefined,
      E.left(
        new Error(
          `value [${expectedRedisDelError.message}] at RedisSessionStorage.del`
        )
      ),
      "should fail if Redis client returns an error on deleting the user tokens"
    ],
    [
      undefined,
      4,
      E.left(
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
  ])("%s, %s, %s, %s", async (tokenDelErr, tokenDelResponse, expected, _) => {
    const aValidUserWithExternalTokens = {
      ...aValidUser,
      bpd_token: mockBPDToken,
      myportal_token: mockMyPortalToken
    };
    const expectedSessionInfoKey = `SESSIONINFO-${aValidUserWithExternalTokens.session_token}`;
    mockDel.mockImplementationOnce(callCallback(tokenDelErr, tokenDelResponse));
    mockSrem.mockImplementationOnce((_, __, callback) => callback(null, 1));

    const response = await sessionStorage.del(aValidUserWithExternalTokens);

    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel.mock.calls[0][0]).toBe(
      `BPD-${aValidUserWithExternalTokens.bpd_token}`
    );
    expect(mockDel.mock.calls[0][1]).toBe(
      `FIMS-${aValidUserWithExternalTokens.fims_token}`
    );
    expect(mockDel.mock.calls[0][2]).toBe(
      `MYPORTAL-${aValidUserWithExternalTokens.myportal_token}`
    );
    expect(mockDel.mock.calls[0][3]).toBe(expectedSessionInfoKey);
    expect(mockDel.mock.calls[0][4]).toBe(
      `SESSION-${aValidUserWithExternalTokens.session_token}`
    );
    expect(mockDel.mock.calls[0][5]).toBe(
      `WALLET-${aValidUserWithExternalTokens.wallet_token}`
    );
    if (E.isRight(expected)) {
      expect(mockSrem).toBeCalledWith(
        `USERSESSIONS-${aValidUserWithExternalTokens.fiscal_code}`,
        `SESSIONINFO-${aValidUserWithExternalTokens.session_token}`,
        expect.any(Function)
      );
    } else {
      expect(mockSrem).not.toBeCalled();
    }
    expect(response).toEqual(expected);
  });
});

describe("RedisSessionStorage#listUserSessions", () => {
  it("should re-init session info and session info set for a user", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, []);
    });
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
    expect(response).toEqual(E.right({ sessions: [expectedSessionInfo] }));
  });

  it("should fails if re-init session info and session info set don't complete", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, []);
    });
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, []);
    });
    mockSet.mockImplementation((_, __, ___, ____, callback) => {
      callback(new Error("REDIS ERROR"), undefined);
    });
    const response = await sessionStorage.listUserSessions(aValidUser);
    expect(mockSadd).not.toBeCalled();
    expect(response).toEqual(E.left(sessionNotFoundError));
  });

  it("should skip a session with invalid value", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, [`SESSIONINFO-${aValidUser.session_token}`]);
    });
    mockExists.mockImplementationOnce((_, callback) => {
      callback(undefined, 1);
    });
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
    mockExists.mockImplementationOnce((_, callback) => {
      callback(undefined, 1);
    });
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
    mockExists.mockImplementationOnce((_, callback) => {
      callback(undefined, 1);
    });
    mockExists.mockImplementationOnce((_, callback) => {
      callback(undefined, 0);
    });
    mockSrem.mockImplementationOnce((_, __, callback) => {
      callback(undefined, 1);
    });

    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, [`SESSIONINFO-${aValidUser.session_token}`]);
    });

    const expectedSessionInfo = SessionInfo.decode({
      createdAt: new Date(),
      sessionToken: aValidUser.session_token
    });
    expect(E.isRight(expectedSessionInfo)).toBeTruthy();
    if (E.isRight(expectedSessionInfo)) {
      mockMget.mockImplementationOnce((_, callback) => {
        callback(undefined, [JSON.stringify(expectedSessionInfo.right)]);
      });

      const response = await sessionStorage.listUserSessions(aValidUser);

      expect(mockMget).toHaveBeenCalledTimes(1);
      expect(mockMget.mock.calls[0][0]).toBe(
        `SESSIONINFO-${aValidUser.session_token}`
      );
      const expectedSessionsList = SessionsList.decode({
        sessions: [expectedSessionInfo.right]
      });
      expect(response).toEqual(expectedSessionsList);
    }
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
    expect(E.isRight(userHasActiveSessionsResult)).toBeTruthy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(true);
    }
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
    expect(E.isRight(userHasActiveSessionsResult)).toBeTruthy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(false);
    }
  });

  it("should return false if doens't exists any session info for the user", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(undefined, []);
    });
    const userHasActiveSessionsResult = await sessionStorage.userHasActiveSessions(
      aValidUser.fiscal_code
    );
    expect(E.isRight(userHasActiveSessionsResult)).toBeTruthy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(false);
    }
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
    expect(E.isRight(userHasActiveSessionsResult)).toBeTruthy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(false);
    }
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
    expect(E.isRight(userHasActiveSessionsResult)).toBeFalsy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(expectedRedisError);
    }
  });

  it("should return left value if a redis error occurs searching session info", async () => {
    const expectedRedisError = new Error("Generic Redis Error");
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(expectedRedisError, undefined);
    });
    const userHasActiveSessionsResult = await sessionStorage.userHasActiveSessions(
      aValidUser.fiscal_code
    );
    expect(E.isRight(userHasActiveSessionsResult)).toBeFalsy();
    if (E.isRight(userHasActiveSessionsResult)) {
      expect(userHasActiveSessionsResult.right).toEqual(expectedRedisError);
    }
  });
});

describe("RedisSessionStorage#setBlockedUser", () => {
  it("should return E.right(true) if the user is correctly locked", async () => {
    mockSadd.mockImplementationOnce((_, __, callback) => callback(null));

    const result = await sessionStorage.setBlockedUser(aFiscalCode);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBe(true);
    }
  });

  it("should return left if the user is not correctly locked", async () => {
    const aError = new Error("any error");
    mockSadd.mockImplementationOnce((_, __, callback) => callback(aError));

    const result = await sessionStorage.setBlockedUser(aFiscalCode);

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBe(aError);
    }
  });
});

describe("RedisSessionStorage#unsetBlockedUser", () => {
  it("should return E.right(true) if the user is correctly unlocked", async () => {
    const sremSuccess = 1;
    mockSrem.mockImplementation((_, __, callback) =>
      callback(null, sremSuccess)
    );

    const result = await sessionStorage.unsetBlockedUser(aFiscalCode);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBe(true);
    }
  });

  it("should return E.left(Error) if the user is not correctly unlocked", async () => {
    const sremFailure = 0;
    mockSrem.mockImplementationOnce((_, __, callback) =>
      callback(null, sremFailure)
    );

    const result = await sessionStorage.unsetBlockedUser(aFiscalCode);

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left instanceof Error).toBe(true);
    }
  });

  it("should return left if for any unhandled failures", async () => {
    const aError = new Error("any error");
    mockSadd.mockImplementationOnce((_, __, callback) => callback(aError));

    const result = await sessionStorage.setBlockedUser(aFiscalCode);

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBe(aError);
    }
  });
});

describe("RedisSessionStorage#delUserAllSessions", () => {
  it("should succeed if user has no session", async () => {
    mockSmembers.mockImplementationOnce((_, callback) => callback(null, []));
    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toBe(true);
    }
  });

  it("should fail if there's an error retrieving user's sessions", async () => {
    const aError = new Error("any error");
    mockSmembers.mockImplementationOnce((_, callback) => callback(aError));
    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toBe(aError);
    }
  });

  it("should fail if the stored user profile is not valid", async () => {
    const invalidProfile = { foo: "bar" };
    mockGet.mockImplementationOnce((_, callback) =>
      callback(null, invalidProfile)
    );

    const result = await sessionStorage.delUserAllSessions(aFiscalCode);

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left instanceof Error).toBe(true);
    }
  });

  it("should succeed if there's no user stored", async () => {
    mockGet.mockImplementationOnce((_, callback) => callback(null, null));

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

describe("RedisSessionStorage#getPagoPaNoticeEmail", () => {
  it("should fail getting a notice email for an missing key", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, null);
    });
    const response = await sessionStorage.getPagoPaNoticeEmail(aValidUser);
    expect(E.isLeft(response)).toBeTruthy();
  });

  it("should fail if the value is not a valid email", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, "fake-wrong-value");
    });
    const response = await sessionStorage.getPagoPaNoticeEmail(aValidUser);
    expect(E.isLeft(response)).toBeTruthy();
  });

  it("should fail if redis get fail with an error", async () => {
    const expectedError = new Error("Redis Error");
    mockGet.mockImplementationOnce((_, callback) => {
      callback(expectedError, undefined);
    });
    const response = await sessionStorage.getPagoPaNoticeEmail(aValidUser);
    expect(response).toEqual(E.left(expectedError));
  });

  it("should return an email if exists the notice key", async () => {
    mockGet.mockImplementationOnce((_, callback) => {
      callback(undefined, anEmailAddress);
    });
    const response = await sessionStorage.getPagoPaNoticeEmail(aValidUser);
    expect(response).toEqual(E.right(anEmailAddress));
  });
});

describe("RedisSessionStorage#delPagoPaNoticeEmail", () => {
  it("should succeded deleting a notice email", async () => {
    mockDel.mockImplementationOnce((_, callback) => {
      callback(undefined, 1);
    });
    const response = await sessionStorage.delPagoPaNoticeEmail(aValidUser);
    expect(response).toEqual(E.right(true));
  });

  it("should fail deleting a notice email", async () => {
    const expectedError = new Error("Redis Error");
    mockDel.mockImplementationOnce((_, callback) => {
      callback(expectedError, undefined);
    });
    const response = await sessionStorage.delPagoPaNoticeEmail(aValidUser);
    expect(response).toEqual(E.left(expectedError));
  });
});

describe("RedisSessionStorage#setPagoPaNoticeEmail", () => {
  it("should succeded setting a notice email key", async () => {
    const expectedTtl = 1000;
    mockTtl.mockImplementationOnce((_, callback) => {
      callback(undefined, expectedTtl);
    });
    mockSet.mockImplementationOnce((_, __, ___, ____, callback) =>
      callback(undefined, "OK")
    );
    const response = await sessionStorage.setPagoPaNoticeEmail(
      aValidUser,
      anEmailAddress
    );
    expect(mockSet).toBeCalledWith(
      `NOTICEEMAIL-${aValidUser.session_token}`,
      anEmailAddress,
      "EX",
      expectedTtl,
      expect.any(Function)
    );
    expect(response).toEqual(E.right(true));
  });

  it("should return left if the notice email key was not created", async () => {
    const expectedTtl = 1000;
    const expectedError = new Error("RedisError");
    mockTtl.mockImplementationOnce((_, callback) => {
      callback(undefined, expectedTtl);
    });
    mockSet.mockImplementationOnce((_, __, ___, ____, callback) =>
      callback(expectedError, undefined)
    );
    const response = await sessionStorage.setPagoPaNoticeEmail(
      aValidUser,
      anEmailAddress
    );
    expect(mockSet).toBeCalledWith(
      `NOTICEEMAIL-${aValidUser.session_token}`,
      anEmailAddress,
      "EX",
      expectedTtl,
      expect.any(Function)
    );
    expect(response).toEqual(E.left(expectedError));
  });
});

describe("RedisSessionStorage#getLollipopAssertionRefForUser", () => {
  it("should success and return an assertionRef", async () => {
    mockGet.mockImplementationOnce((_, callback) =>
      callback(null, anAssertionRef)
    );
    const response = await sessionStorage.getLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toBeCalledWith(
      `KEYS-${aValidUser.fiscal_code}`,
      expect.any(Function)
    );
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response) && O.isSome(response.right))
      expect(response.right.value).toEqual(anAssertionRef);
  });

  it("should success and return none if assertionRef is missing", async () => {
    mockGet.mockImplementationOnce((_, callback) => callback(null, null));
    const response = await sessionStorage.getLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toBeCalledWith(
      `KEYS-${aValidUser.fiscal_code}`,
      expect.any(Function)
    );
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response)) expect(O.isNone(response.right)).toBeTruthy();
  });
  it("should fail with a left response if an error occurs on redis", async () => {
    const expectedError = new Error("redis Error");
    mockGet.mockImplementationOnce((_, callback) => callback(expectedError));
    const response = await sessionStorage.getLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toBeCalledWith(
      `KEYS-${aValidUser.fiscal_code}`,
      expect.any(Function)
    );
    expect(E.isLeft(response)).toBeTruthy();
    if (E.isLeft(response)) expect(response.left).toEqual(expectedError);
  });

  it("should fail with a left response if the value stored is invalid", async () => {
    mockGet.mockImplementationOnce((_, callback) =>
      callback(null, "an invalid value")
    );
    const response = await sessionStorage.getLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toBeCalledWith(
      `KEYS-${aValidUser.fiscal_code}`,
      expect.any(Function)
    );
    expect(E.isLeft(response)).toBeTruthy();
  });
});

describe("RedisSessionStorage#setLollipopAssertionRefForUser", () => {
  it("should success if the response from redis is OK on set command with default ttl", async () => {
    mockSet.mockImplementationOnce((_, __, ___, ____, callback) =>
      callback(null, "OK")
    );
    const response = await sessionStorage.setLollipopAssertionRefForUser(
      aValidUser,
      anAssertionRef
    );

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toBeCalledWith(
      `KEYS-${aValidUser.fiscal_code}`,
      anAssertionRef,
      "EX",
      aDefaultLollipopAssertionRefDurationSec,
      expect.any(Function)
    );
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response)) expect(response.right).toEqual(true);
  });

  it("should success if the response from redis is OK on set command with custom ttl", async () => {
    const expectedAssertionRefTtl = 100 as Second;
    mockSet.mockImplementationOnce((_, __, ___, ____, callback) =>
      callback(null, "OK")
    );
    const response = await sessionStorage.setLollipopAssertionRefForUser(
      aValidUser,
      anAssertionRef,
      expectedAssertionRefTtl
    );

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toBeCalledWith(
      `KEYS-${aValidUser.fiscal_code}`,
      anAssertionRef,
      "EX",
      expectedAssertionRefTtl,
      expect.any(Function)
    );
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response)) expect(response.right).toEqual(true);
  });

  it("should fail with a left response if an error occurs on redis", async () => {
    const expectedError = new Error("redis Error");
    mockSet.mockImplementationOnce((_, __, ___, ____, callback) =>
      callback(expectedError)
    );
    const response = await sessionStorage.setLollipopAssertionRefForUser(
      aValidUser,
      anAssertionRef
    );

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toBeCalledWith(
      `KEYS-${aValidUser.fiscal_code}`,
      anAssertionRef,
      "EX",
      aDefaultLollipopAssertionRefDurationSec,
      expect.any(Function)
    );
    expect(E.isLeft(response)).toBeTruthy();
    if (E.isLeft(response)) expect(response.left).toEqual(expectedError);
  });

  it("should fail with a left response if the redis session is not OK", async () => {
    mockSet.mockImplementationOnce((_, __, ___, ____, callback) =>
      callback(null, undefined)
    );
    const response = await sessionStorage.setLollipopAssertionRefForUser(
      aValidUser,
      anAssertionRef
    );

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toBeCalledWith(
      `KEYS-${aValidUser.fiscal_code}`,
      anAssertionRef,
      "EX",
      aDefaultLollipopAssertionRefDurationSec,
      expect.any(Function)
    );
    expect(E.isLeft(response)).toBeTruthy();
  });
});

describe("RedisSessionStorage#delLollipopAssertionRefForUser", () => {
  it("should return a right either with true value on success", async () => {
    mockDel.mockImplementationOnce((_, callback) => callback(null, 1));
    const response = await sessionStorage.delLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel).toBeCalledWith(
      `KEYS-${aValidUser.fiscal_code}`,
      expect.any(Function)
    );
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response)) expect(response.right).toEqual(true);
  });

  it("should fail with a left response if an error occurs on redis", async () => {
    const expectedError = new Error("redis Error");
    mockDel.mockImplementationOnce((_, callback) => callback(expectedError));
    const response = await sessionStorage.delLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel).toBeCalledWith(
      `KEYS-${aValidUser.fiscal_code}`,
      expect.any(Function)
    );
    expect(E.isLeft(response)).toBeTruthy();
    if (E.isLeft(response)) expect(response.left).toEqual(expectedError);
  });

  it("should success if no element are removed from redis", async () => {
    mockDel.mockImplementationOnce((_, callback) => callback(null, 0));
    const response = await sessionStorage.delLollipopAssertionRefForUser(
      aValidUser.fiscal_code
    );

    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel).toBeCalledWith(
      `KEYS-${aValidUser.fiscal_code}`,
      expect.any(Function)
    );
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response)) expect(response.right).toEqual(true);
  });
});
