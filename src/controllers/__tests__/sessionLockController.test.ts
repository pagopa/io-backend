import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import RedisSessionStorage from "../../services/redisSessionStorage";
import RedisUserMetadataStorage from "../../services/redisUserMetadataStorage";
import SessionLockController from "../sessionLockController";
import { pipe } from "fp-ts/lib/function";
import { PubKeyStatusEnum } from "../../../generated/lollipop-api/PubKeyStatus";
import { AssertionRef } from "../../../generated/lollipop-api/AssertionRef";
import { AssertionTypeEnum } from "../../../generated/lollipop-api/AssertionType";
import { JwkPubKey } from "../../../generated/lollipop-api/JwkPubKey";
import { ActivatedPubKey } from "../../../generated/lollipop-api/ActivatedPubKey";
import LollipopService from "../../services/lollipopService";
import { LollipopApiClient } from "../../clients/lollipop";
import { anAssertionRef } from "../../__mocks__/lollipop";
import { LoginTypeEnum } from "../../utils/fastLogin";
import { addSeconds } from "date-fns";

import {
  AuthenticationLockServiceMock,
  aNotReleasedData,
  anUnlockCode,
  getUserAuthenticationLockDataMock,
  isUserAuthenticationLockedMock,
  lockUserAuthenticationMockLazy,
  unlockUserAuthenticationMock,
} from "../../__mocks__/services.mock";
import { anothernUnlockCode } from "../../__mocks__/lockedProfileTableClient";
import {
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import NotificationService from "../../services/notificationService";

const aFiscalCode = pipe(
  "AAABBB80A01C123D",
  FiscalCode.decode,
  E.getOrElseW(() => {
    throw new Error("invalid mock FiscalCode");
  })
);

const mockDelUserAllSessions = jest
  .fn()
  .mockImplementation(async () => E.right(true));
const mockSetBlockedUser = jest
  .fn()
  .mockImplementation(async () => E.right(true));
const mockUnsetBlockedUser = jest
  .fn()
  .mockImplementation(async () => E.right(true));
const mockUserHasActiveSessionsOrLV = jest
  .fn()
  .mockImplementation(async () => E.right(true));
const mockDelLollipop = jest.fn().mockResolvedValue(E.right(true));
const mockGetLollipop = jest
  .fn()
  .mockResolvedValue(E.right(O.some(anAssertionRef)));
const mockSetLollipop = jest.fn().mockResolvedValue(E.right(true));

const expectedSessionTTL = 123;
const mockGetSessionRemainingTTL = jest
  .fn()
  .mockReturnValue(
    TE.right(O.some({ ttl: expectedSessionTTL, type: LoginTypeEnum.LV }))
  );
const mockRedisSessionStorage = {
  delUserAllSessions: mockDelUserAllSessions,
  setBlockedUser: mockSetBlockedUser,
  unsetBlockedUser: mockUnsetBlockedUser,
  userHasActiveSessionsOrLV: mockUserHasActiveSessionsOrLV,
  getLollipopAssertionRefForUser: mockGetLollipop,
  delLollipopDataForUser: mockDelLollipop,
  setLollipopAssertionRefForUser: mockSetLollipop,
  getSessionRemainingTTL: mockGetSessionRemainingTTL,
} as unknown as RedisSessionStorage;

const mockDel = jest.fn().mockImplementation(async () => E.right(true));
const mockRedisUserMetadataStorage = {
  del: mockDel,
} as unknown as RedisUserMetadataStorage;

const anActivatedPubKey = {
  status: PubKeyStatusEnum.VALID,
  assertion_file_name: "file",
  assertion_ref: "sha" as AssertionRef,
  assertion_type: AssertionTypeEnum.SAML,
  fiscal_code: aFiscalCode,
  pub_key: {} as JwkPubKey,
  ttl: 600,
  version: 1,
  expires_at: 1000,
} as unknown as ActivatedPubKey;

const mockRevokePreviousAssertionRef = jest
  .fn()
  .mockImplementation((_) => Promise.resolve({}));

const mockActivateLolliPoPKey = jest
  .fn()
  .mockImplementation((_, __, ___) => TE.of(anActivatedPubKey));

jest.mock("../../services/lollipopService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      revokePreviousAssertionRef: mockRevokePreviousAssertionRef,
      activateLolliPoPKey: mockActivateLolliPoPKey,
    })),
  };
});

const mockLollipopService = new LollipopService(
  {} as ReturnType<LollipopApiClient>,
  "",
  ""
);

const mockDeleteInstallation = jest
  .fn()
  .mockResolvedValue(ResponseSuccessJson({ message: "ok" }));
const mockNotificationService = {
  deleteInstallation: mockDeleteInstallation,
};

const notificationServiceFactory = (_fiscalCode: FiscalCode) =>
  mockNotificationService as any as NotificationService;

const controller = new SessionLockController(
  mockRedisSessionStorage,
  mockRedisUserMetadataStorage,
  mockLollipopService,
  AuthenticationLockServiceMock,
  notificationServiceFactory
);

describe("SessionLockController#getUserSession", () => {
  it("should fail on invalid fiscal code", async () => {
    const req = mockReq({ params: { fiscal_code: "invalid" } });
    const res = mockRes();

    const response = await controller.getUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should fail if userHasActiveSessionsOrLV returns an error", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockUserHasActiveSessionsOrLV.mockImplementationOnce(async () =>
      E.left(new Error("any error"))
    );

    const response = await controller.getUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should succeed on correct request", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    const response = await controller.getUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      active: true,
    });
  });
});

describe("SessionLockController#lockUserSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail on invalid fiscal code", async () => {
    const req = mockReq({ params: { fiscal_code: "invalid" } });
    const res = mockRes();

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should fail on invalid request", async () => {
    const req = mockReq({ params: { invalid: true } });
    const res = mockRes();

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should succeed on correct request", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "ok",
    });
  });

  it("should fail on lock error", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockSetBlockedUser.mockImplementationOnce(async () => E.left("any error"));

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail when get assertionRef return left", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockGetLollipop.mockImplementationOnce(async () => E.left("any error"));

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).not.toHaveBeenCalled();
    expect(mockDelUserAllSessions).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail when get assertionRef throws", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockGetLollipop.mockImplementationOnce(async () => {
      throw "error";
    });

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).not.toHaveBeenCalled();
    expect(mockDelUserAllSessions).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail when delete assertionRef return left", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockDelLollipop.mockImplementationOnce(async () => E.left("any error"));

    const response = await controller.lockUserSession(req);
    response.apply(res);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalled();
    expect(mockDelUserAllSessions).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail when delete assertionRef throws", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockDelLollipop.mockImplementationOnce(async () => {
      throw "error";
    });

    const response = await controller.lockUserSession(req);
    response.apply(res);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalled();
    expect(mockDelUserAllSessions).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail on delete session error", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockDelUserAllSessions.mockImplementationOnce(async () =>
      E.left("any error")
    );

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail on delete metadata error", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockDel.mockImplementationOnce(async () => E.left("any error"));

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("SessionLockController#unlockUserSession", () => {
  it("should fail on invalid fiscal code", async () => {
    const req = mockReq({ params: { fiscal_code: "invalid" } });
    const res = mockRes();

    const response = await controller.unlockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should fail on invalid request", async () => {
    const req = mockReq({ params: { invalid: true } });
    const res = mockRes();

    const response = await controller.unlockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should succeed on correct request", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "ok",
    });
  });

  it("should fail on unlock error", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockUnsetBlockedUser.mockImplementationOnce(async () =>
      E.left("any error")
    );

    const response = await controller.unlockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("SessionLockController#deleteUserSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail on invalid fiscal code", async () => {
    const req = mockReq({ params: { fiscal_code: "invalid" } });
    const res = mockRes();

    const response = await controller.deleteUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should fail on invalid request", async () => {
    const req = mockReq({ params: { invalid: true } });
    const res = mockRes();

    const response = await controller.deleteUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should succeed on correct request", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    const response = await controller.deleteUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockGetLollipop).toHaveBeenCalled();
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalled();
    expect(mockDelLollipop).toHaveBeenCalled();
    expect(mockDelUserAllSessions).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "ok",
    });
  });

  it("should fail when get assertionRef return left", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockGetLollipop.mockImplementationOnce(async () => E.left("any error"));

    const response = await controller.deleteUserSession(req);
    response.apply(res);

    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).not.toHaveBeenCalled();
    expect(mockDelUserAllSessions).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail when get assertionRef throws", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockGetLollipop.mockImplementationOnce(async () => {
      throw "error";
    });

    const response = await controller.deleteUserSession(req);
    response.apply(res);

    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).not.toHaveBeenCalled();
    expect(mockDelUserAllSessions).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail when delete assertionRef return left", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockDelLollipop.mockImplementationOnce(async () => E.left("any error"));

    const response = await controller.deleteUserSession(req);
    response.apply(res);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalled();
    expect(mockDelUserAllSessions).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail when delete assertionRef throws", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockDelLollipop.mockImplementationOnce(async () => {
      throw "error";
    });

    const response = await controller.deleteUserSession(req);
    response.apply(res);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalled();
    expect(mockDelUserAllSessions).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should fail on delete session error", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();

    mockDelUserAllSessions.mockImplementationOnce(async () =>
      E.left("any error")
    );

    const response = await controller.lockUserSession(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("SessionLockController#lockUserAuthentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const aValidRequest = {
    params: { fiscal_code: aFiscalCode },
    body: { unlock_code: anUnlockCode },
  };

  it("should succeed storing CF-unlockcode when request is valid and the association has not been previously stored", async () => {
    const req = mockReq(aValidRequest);
    const res = mockRes();

    const response = await controller.lockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(204);

    expect(isUserAuthenticationLockedMock).toHaveBeenCalledWith(aFiscalCode);
    expect(lockUserAuthenticationMockLazy).toHaveBeenCalledWith(
      aFiscalCode,
      anUnlockCode
    );

    // Check user session clean up
    expect(mockGetLollipop).toHaveBeenCalled();
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalled();
    expect(mockDelLollipop).toHaveBeenCalled();
    expect(mockDelUserAllSessions).toHaveBeenCalled();

    expect(mockDeleteInstallation).toHaveBeenCalledWith(aFiscalCode);
  });

  it("should return 409 when request is valid and the user authentication is already locked", async () => {
    isUserAuthenticationLockedMock.mockReturnValueOnce(TE.of(true));

    const req = mockReq(aValidRequest);
    const res = mockRes();

    const response = await controller.lockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(lockUserAuthenticationMockLazy).not.toHaveBeenCalled();
  });

  it("should return 500 when request is valid and an error occurred storing cf-unlockcode", async () => {
    lockUserAuthenticationMockLazy.mockResolvedValueOnce(
      E.left(new Error("an error"))
    );
    const req = mockReq(aValidRequest);
    const res = mockRes();

    const response = await controller.lockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should return 500 when request is valid and something went wrong checking user authentication lock", async () => {
    isUserAuthenticationLockedMock.mockReturnValueOnce(
      TE.left(new Error("an error"))
    );
    const req = mockReq(aValidRequest);
    const res = mockRes();

    const response = await controller.lockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(lockUserAuthenticationMockLazy).not.toHaveBeenCalled();
  });

  it("should return 500 when request is valid and something went wrong deleting user session", async () => {
    mockDelLollipop.mockImplementationOnce(async () => {
      throw "error";
    });

    const req = mockReq(aValidRequest);
    const res = mockRes();

    const response = await controller.lockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(lockUserAuthenticationMockLazy).not.toHaveBeenCalled();
  });

  it("should return 500 when request is valid and something went wrong calling deleteInstallation", async () => {
    mockDeleteInstallation.mockImplementationOnce(async () => {
      throw "error";
    });

    const req = mockReq(aValidRequest);
    const res = mockRes();

    const response = await controller.lockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(lockUserAuthenticationMockLazy).not.toHaveBeenCalled();
  });

  it("should return 500 when request is valid and deleteInstallation returns an error", async () => {
    mockDeleteInstallation.mockResolvedValueOnce(
      ResponseErrorInternal("An error occurred")
    );

    const req = mockReq(aValidRequest);
    const res = mockRes();

    const response = await controller.lockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(lockUserAuthenticationMockLazy).not.toHaveBeenCalled();
  });

  it.each`
    title                         | unlockCode      | fiscalCode
    ${"unlock code is empty"}     | ${""}           | ${aFiscalCode}
    ${"unlock code is undefined"} | ${undefined}    | ${aFiscalCode}
    ${"unlock code is invalid"}   | ${123}          | ${aFiscalCode}
    ${"fiscal code is invalid"}   | ${anUnlockCode} | ${"INVALID"}
  `("should return 400 when $title", async ({ unlockCode, fiscalCode }) => {
    const req = mockReq({
      params: { fiscal_code: fiscalCode },
      body: { unlock_code: unlockCode },
    });
    const res = mockRes();

    const response = await controller.lockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(lockUserAuthenticationMockLazy).not.toHaveBeenCalled();
  });
});

describe("SessionLockController#unlockUserAuthentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const aValidRequest = {
    params: { fiscal_code: aFiscalCode },
    body: { unlock_code: anUnlockCode },
  };
  const aValidRequestWithoutUnlockCode = {
    params: { fiscal_code: aFiscalCode },
    body: {},
  };

  it.each`
    title                                      | request
    ${"request contains unlock code"}          | ${aValidRequest}
    ${"request does NOT contains unlock code"} | ${aValidRequestWithoutUnlockCode}
  `(
    "should succeed releasing CF-unlockcode when user authentication is locked and $title",
    async ({ request }) => {
      const req = mockReq(request);
      const res = mockRes();

      getUserAuthenticationLockDataMock.mockReturnValueOnce(
        TE.of([
          aNotReleasedData,
          { ...aNotReleasedData, rowKey: anothernUnlockCode },
        ])
      );

      const response = await controller.unlockUserAuthentication(req);
      response.apply(res);

      expect(res.status).toHaveBeenCalledWith(204);

      expect(getUserAuthenticationLockDataMock).toHaveBeenCalledWith(
        aFiscalCode
      );
      expect(unlockUserAuthenticationMock).toHaveBeenCalledWith(
        aFiscalCode,
        "unlock_code" in request.body
          ? [request.body.unlock_code]
          : [anUnlockCode, anothernUnlockCode]
      );
    }
  );

  it.each`
    title                                      | request
    ${"request contains unlock code"}          | ${aValidRequest}
    ${"request does NOT contains unlock code"} | ${aValidRequestWithoutUnlockCode}
  `(
    "should succeed releasing CF-unlockcode when $title and query returns no records",
    // This can occur in cases where there is either no user authentication lock or when an invalid unlock code has been provided.
    async ({ request }) => {
      const req = mockReq(request);
      const res = mockRes();

      const response = await controller.unlockUserAuthentication(req);
      response.apply(res);

      expect(res.status).toHaveBeenCalledWith(204);

      expect(getUserAuthenticationLockDataMock).toHaveBeenCalled();
      expect(unlockUserAuthenticationMock).not.toHaveBeenCalled();
    }
  );

  it("should return Forbidden releasing CF-unlockcode when unlock code does not match", async () => {
    // This can occur in cases where there is either no user authentication lock or when an invalid unlock code has been provided.
    const req = mockReq(aValidRequest);
    const res = mockRes();

    getUserAuthenticationLockDataMock.mockReturnValueOnce(
      TE.of([{ ...aNotReleasedData, rowKey: anothernUnlockCode }])
    );

    const response = await controller.unlockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(getUserAuthenticationLockDataMock).toHaveBeenCalled();
    expect(unlockUserAuthenticationMock).not.toHaveBeenCalled();
  });

  it("should return InternalServerError when an error occurred retrieving user authentication lock data", async () => {
    const req = mockReq(aValidRequest);
    const res = mockRes();

    getUserAuthenticationLockDataMock.mockReturnValueOnce(
      TE.left(Error("an Error"))
    );

    const response = await controller.unlockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(unlockUserAuthenticationMock).not.toHaveBeenCalled();
  });

  it("should return InternalServerError when an error occurred releasing authentication lock", async () => {
    const req = mockReq(aValidRequest);
    const res = mockRes();

    getUserAuthenticationLockDataMock.mockReturnValueOnce(
      TE.of([aNotReleasedData])
    );

    unlockUserAuthenticationMock.mockReturnValueOnce(() =>
      E.left(Error("an Error"))
    );

    const response = await controller.unlockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(getUserAuthenticationLockDataMock).toHaveBeenCalled();
    expect(unlockUserAuthenticationMock).toHaveBeenCalled();
  });

  it.each`
    title                       | unlockCode      | fiscalCode
    ${"unlock code is empty"}   | ${""}           | ${aFiscalCode}
    ${"unlock code is invalid"} | ${123}          | ${aFiscalCode}
    ${"fiscal code is invalid"} | ${anUnlockCode} | ${"INVALID"}
  `("should return 400 when $title", async ({ unlockCode, fiscalCode }) => {
    const req = mockReq({
      params: { fiscal_code: fiscalCode },
      body: { unlock_code: unlockCode },
    });
    const res = mockRes();

    const response = await controller.unlockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(getUserAuthenticationLockDataMock).not.toHaveBeenCalled();
    expect(unlockUserAuthenticationMock).not.toHaveBeenCalled();
  });
});

describe("SessionLockController#getUserSessionState", () => {
  const froxenNowDate = new Date();
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(froxenNowDate);
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it("should return success if an unlocked session exists", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();
    const response = await controller.getUserSessionState(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(response.kind).toEqual("IResponseSuccessJson");
    if (response.kind === "IResponseSuccessJson")
      expect(response.value).toEqual({
        access_enabled: true,
        session_info: expect.objectContaining({
          active: true,
          expiration_date: addSeconds(
            froxenNowDate,
            expectedSessionTTL
          ).toISOString(),
          type: LoginTypeEnum.LV,
        }),
      });
  });

  it("should return success if a locked session exists", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();
    isUserAuthenticationLockedMock.mockReturnValueOnce(TE.right(true));
    const response = await controller.getUserSessionState(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(response.kind).toEqual("IResponseSuccessJson");
    if (response.kind === "IResponseSuccessJson")
      expect(response.value).toEqual({
        access_enabled: false,
        session_info: expect.objectContaining({
          active: true,
          expiration_date: addSeconds(
            froxenNowDate,
            expectedSessionTTL
          ).toISOString(),
          type: LoginTypeEnum.LV,
        }),
      });
  });

  it("should return success if a session doens't exists", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();
    mockGetSessionRemainingTTL.mockReturnValueOnce(TE.right(O.none));
    const response = await controller.getUserSessionState(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(response.kind).toEqual("IResponseSuccessJson");
    if (response.kind === "IResponseSuccessJson")
      expect(response.value).toEqual({
        access_enabled: true,
        session_info: {
          active: false,
        },
      });
  });

  it("should fail if an invalid CF was provided", async () => {
    const req = mockReq({ params: { fiscal_code: "invalid_cf" } });
    const res = mockRes();
    mockGetSessionRemainingTTL.mockReturnValueOnce(TE.right(O.none));
    const response = await controller.getUserSessionState(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(response.kind).toEqual("IResponseErrorValidation");
  });

  it("should fail if an error occours reading the session lock state", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();
    isUserAuthenticationLockedMock.mockReturnValueOnce(
      TE.left(new Error("an error"))
    );
    const response = await controller.getUserSessionState(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(response.kind).toEqual("IResponseErrorInternal");
  });

  it("should fail if an error occours reading the session TTL", async () => {
    const req = mockReq({ params: { fiscal_code: aFiscalCode } });
    const res = mockRes();
    mockGetSessionRemainingTTL.mockReturnValueOnce(
      TE.left(new Error("an error"))
    );
    const response = await controller.getUserSessionState(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(response.kind).toEqual("IResponseErrorInternal");
  });
});
