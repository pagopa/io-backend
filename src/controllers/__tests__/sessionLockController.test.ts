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
import AuthenticationLockService from "../../services/authenticationLockService";
import { TableClient } from "@azure/data-tables";

import {
  AuthenticationLockServiceMock,
  isUserAuthenticationLockedMock,
  lockUserAuthenticationMockLazy,
} from "../../__mocks__/services.mock";

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
const mockRedisSessionStorage = {
  delUserAllSessions: mockDelUserAllSessions,
  setBlockedUser: mockSetBlockedUser,
  unsetBlockedUser: mockUnsetBlockedUser,
  userHasActiveSessionsOrLV: mockUserHasActiveSessionsOrLV,
  getLollipopAssertionRefForUser: mockGetLollipop,
  delLollipopDataForUser: mockDelLollipop,
  setLollipopAssertionRefForUser: mockSetLollipop,
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

const controller = new SessionLockController(
  mockRedisSessionStorage,
  mockRedisUserMetadataStorage,
  mockLollipopService,
  AuthenticationLockServiceMock
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

  const anUnlockCode = "123456789";

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

  it.each`
    title                       | unlockCode      | fiscalCode
    ${"unlock code is empty"}   | ${""}           | ${aFiscalCode}
    ${"unlock code is invalid"} | ${123}          | ${aFiscalCode}
    ${"fiscal code is invalid"} | ${anUnlockCode} | ${"INVALID"}
  `("should return 400 when $title", async ({ unlockCode, fiscalCode }) => {
    const req = mockReq({
      params: { fiscal_code: fiscalCode },
      body: { unlockCode },
    });
    const res = mockRes();

    const response = await controller.lockUserAuthentication(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(lockUserAuthenticationMockLazy).not.toHaveBeenCalled();
  });
});
