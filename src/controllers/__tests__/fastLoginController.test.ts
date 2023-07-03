import RedisSessionStorage from "../../services/redisSessionStorage";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as RNEA from "fp-ts/lib/ReadonlyNonEmptyArray";
import * as redis from "redis";
import { aFiscalCode } from "../../__mocks__/user_mock";
import TokenService from "../../services/tokenService";
import { ActivatedPubKey } from "../../../generated/lollipop-api/ActivatedPubKey";
import { PubKeyStatusEnum } from "../../../generated/lollipop-api/PubKeyStatus";
import { AssertionRef } from "../../../generated/lollipop-api/AssertionRef";
import { AssertionTypeEnum } from "../../../generated/lollipop-api/AssertionType";
import { JwkPubKey } from "../../../generated/lollipop-api/JwkPubKey";
import { fastLoginEndpoint } from "../fastLoginController";
import { Second } from "@pagopa/ts-commons/lib/units";
import { getFastLoginLollipopConsumerClient } from "../../clients/fastLoginLollipopConsumerClient";
import {
  aLollipopOriginalUrl,
  anAssertionRef,
  anotherAssertionRef,
  aSignature,
  aSignatureInput,
} from "../../__mocks__/lollipop";
import { LollipopMethodEnum } from "../../../generated/lollipop/LollipopMethod";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { LollipopLocalsType } from "../../types/lollipop";
import { LollipopJWTAuthorization } from "../../../generated/fast-login-api/LollipopJWTAuthorization";
import { LollipopPublicKey } from "../../../generated/fast-login-api/LollipopPublicKey";
import { SessionToken } from "../../types/token";
import { aSAMLResponse } from "../../utils/__mocks__/spid";
import { FastLoginResponse as LCFastLoginResponse } from "../../../generated/fast-login-api/FastLoginResponse";
import { BadRequest } from "../../../generated/fast-login-api/BadRequest";
import * as spidUtils from "../../utils/spid";
import { pipe } from "fp-ts/lib/function";

const mockSet = jest.fn();
const mockGetBySessionToken = jest.fn();
const mockGetByWalletToken = jest.fn();
const mockDel = jest.fn();
const mockDelLollipop = jest.fn();
const mockGetLollipop = jest.fn();
const mockSetLollipop = jest.fn();
const mockIsBlockedUser = jest.fn();
jest.mock("../../services/redisSessionStorage", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      del: mockDel,
      getLollipopAssertionRefForUser: mockGetLollipop,
      delLollipopAssertionRefForUser: mockDelLollipop,
      setLollipopAssertionRefForUser: mockSetLollipop,
      getBySessionToken: mockGetBySessionToken,
      getByWalletToken: mockGetByWalletToken,
      isBlockedUser: mockIsBlockedUser,
      set: mockSet,
    })),
  };
});

mockDelLollipop.mockImplementation(() => Promise.resolve(E.right(true)));

const aRandomToken = "RANDOMTOKEN";
const mockGetNewToken = jest.fn().mockResolvedValue(aRandomToken);
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getNewToken: mockGetNewToken,
      getNewTokenAsync: () => Promise.resolve(mockGetNewToken()),
    })),
  };
});

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
const redisClient = {} as redis.RedisClientType;

const tokenService = new TokenService();
const sessionTTL = 60 * 15;

const aDefaultLollipopAssertionRefDurationSec = (3600 * 24 * 365 * 2) as Second;

const redisSessionStorage = new RedisSessionStorage(
  redisClient,
  sessionTTL,
  aDefaultLollipopAssertionRefDurationSec
);

const mockLCFastLogin = jest.fn();
const fastLoginLCClient = {
  fastLogin: mockLCFastLogin,
} as unknown as ReturnType<getFastLoginLollipopConsumerClient>;

const aBearerToken = "token" as LollipopJWTAuthorization;
const aPublicKey = "publickey" as LollipopPublicKey;

const lollipopRequestHeaders = {
  signature: aSignature,
  ["signature-input"]: aSignatureInput,
  ["x-pagopa-lollipop-original-method"]: LollipopMethodEnum.POST,
  ["x-pagopa-lollipop-original-url"]: aLollipopOriginalUrl,
};

const fastLoginLollipopLocals: LollipopLocalsType = {
  ...lollipopRequestHeaders,
  ["x-pagopa-lollipop-assertion-ref"]: anAssertionRef,
  ["x-pagopa-lollipop-assertion-type"]: AssertionTypeEnum.SAML,
  ["x-pagopa-lollipop-auth-jwt"]: aBearerToken,
  ["x-pagopa-lollipop-public-key"]: aPublicKey,
  // this fiscalcode is in the LV_TEST_USERS array inside .env.example
  ["x-pagopa-lollipop-user-id"]: aFiscalCode,
};

const validFastLoginControllerResponse = {
  token: aRandomToken as SessionToken,
};
const validFastLoginLCResponse = {
  saml_response: aSAMLResponse,
} as LCFastLoginResponse;

const controller = fastLoginEndpoint(
  fastLoginLCClient,
  redisSessionStorage,
  tokenService,
  sessionTTL
);

describe("fastLoginController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a valid session of 15 minutes given a valid payload", async () => {
    const validUserSetPayload = {
      session_token: aRandomToken,
      bpd_token: aRandomToken,
      fims_token: aRandomToken,
      wallet_token: aRandomToken,
      zendesk_token: aRandomToken,
      myportal_token: aRandomToken,
      created_at: expect.any(Number),
      date_of_birth: "1970-01-01",
      family_name: "AgID",
      fiscal_code: expect.any(String),
      name: "SpidValidator",
      session_tracking_id: aRandomToken,
      spid_email: "spid.tech@agid.gov.it",
      spid_idp: "http://localhost:8080",
      spid_level: "https://www.spid.gov.it/SpidL2",
    };
    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockLCFastLogin.mockResolvedValueOnce(
      E.right({ status: 200, value: validFastLoginLCResponse })
    );
    mockIsBlockedUser.mockResolvedValueOnce(E.right(false));
    mockSet.mockResolvedValueOnce(E.right(true));

    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockGetLollipop).toHaveBeenCalledWith(aFiscalCode);
    expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
    expect(mockLCFastLogin).toHaveBeenCalledWith(fastLoginLollipopLocals);

    expect(mockIsBlockedUser).toHaveBeenCalledTimes(1);
    expect(mockIsBlockedUser).toHaveBeenCalledWith(aFiscalCode);

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(validUserSetPayload, sessionTTL);

    expect(mockGetNewToken).toHaveBeenCalledTimes(7);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(validFastLoginControllerResponse);
  });

  it("should fail when lollipop locals are invalid", async () => {
    const response = await controller(mockReq(), {
      ...fastLoginLollipopLocals,
      "x-pagopa-lollipop-user-id": "NOTAFISCALCODE",
    });
    const res = mockRes();
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Internal server error",
        detail: "Could not initialize Lollipop",
      })
    );
  });

  it("should fail when the sessionStorage had a connection error", async () => {
    mockGetLollipop.mockRejectedValueOnce(null);
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Internal server error",
        detail: "Error while trying to get Lollipop initialization",
      })
    );
  });

  it("should fail when the sessionStorage can't find an assertionRef related to the user", async () => {
    mockGetLollipop.mockResolvedValueOnce(E.left(new Error("error")));
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Internal server error",
        detail: "Error while validating Lollipop initialization: error",
      })
    );
  });

  it.each`
    scenario                                                            | storageResult
    ${"the assertionRef was not found"}                                 | ${O.none}
    ${"the assertionRef is not the same as the one in lollipop locals"} | ${O.some(anotherAssertionRef)}
  `("should return 403 when $title", async ({ storageResult }) => {
    mockGetLollipop.mockResolvedValueOnce(E.right(storageResult));
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "You are not allowed here",
        detail:
          "You do not have enough permission to complete the operation you requested",
      })
    );
  });

  it("should fail when the lollipop consumer can't be contacted", async () => {
    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockLCFastLogin.mockRejectedValueOnce(null);
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Internal server error",
        detail: "Error while calling the Lollipop Consumer",
      })
    );
  });

  it("should fail when the lollipop consumer gives a decoding error", async () => {
    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockLCFastLogin.mockResolvedValueOnce(BadRequest.decode({}));
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Internal server error",
        detail: expect.stringContaining(
          "Unexpected Lollipop consumer response"
        ),
      })
    );
  });

  it("should return 401 when the lollipop consumer gives a 401 Unauthorized", async () => {
    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockLCFastLogin.mockResolvedValueOnce(E.right({ status: 401 }));
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Unauthorized",
        detail: "Invalid signature or nonce expired",
      })
    );
  });

  it.each`
    title                   | status
    ${"500"}                | ${500}
    ${"other status codes"} | ${599}
  `(
    "should return 500 when the lollipop consumer gives $title",
    async ({ status }) => {
      mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
      mockLCFastLogin.mockResolvedValueOnce(
        E.right({ status: status, value: { detail: "error", title: "error" } })
      );
      const response = await controller(mockReq(), fastLoginLollipopLocals);
      const res = mockRes();
      response.apply(res);

      expect(mockGetLollipop).toHaveBeenCalledTimes(1);
      expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Internal server error",
          detail: `Error in Lollipop consumer. Response contains ${status} with title error and detail error`,
        })
      );
    }
  );

  it("should return 500 when the lollipop consumer gives an invalid saml_response", async () => {
    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockLCFastLogin.mockResolvedValueOnce(
      E.right({ status: 200, value: { saml_response: "" } })
    );
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Internal server error",
        detail: "Could not parse saml response from Lollipop consumer",
      })
    );
  });

  it("should return 403 when the user is blocked", async () => {
    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockLCFastLogin.mockResolvedValueOnce(
      E.right({ status: 200, value: validFastLoginLCResponse })
    );
    mockIsBlockedUser.mockResolvedValueOnce(E.right(true));
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
    expect(mockIsBlockedUser).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Unauthorized",
        detail: "User is blocked",
      })
    );
  });

  it("should return 500 when the session storage could not determine if the user is blocked", async () => {
    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockLCFastLogin.mockResolvedValueOnce(
      E.right({ status: 200, value: validFastLoginLCResponse })
    );
    mockIsBlockedUser.mockResolvedValueOnce(E.left(new Error("error")));
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
    expect(mockIsBlockedUser).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Internal server error",
        detail: "Error while validating user",
      })
    );
  });

  it("should return 500 when the controller can't extract the data from the saml_response", async () => {
    const makeProxyUser = jest.spyOn(
      spidUtils,
      "makeProxyUserFromSAMLResponse"
    );

    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockLCFastLogin.mockResolvedValueOnce(
      E.right({ status: 200, value: validFastLoginLCResponse })
    );
    mockIsBlockedUser.mockResolvedValueOnce(E.right(false));
    makeProxyUser.mockReturnValueOnce(O.none);

    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
    expect(mockIsBlockedUser).toHaveBeenCalledTimes(1);
    expect(makeProxyUser).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Internal server error",
        detail: "Could not create proxy user",
      })
    );
  });

  it("should return 500 when the session storage could not create the session for the user", async () => {
    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockLCFastLogin.mockResolvedValueOnce(
      E.right({ status: 200, value: validFastLoginLCResponse })
    );
    mockIsBlockedUser.mockResolvedValueOnce(E.right(false));
    mockSet.mockReturnValueOnce(E.left(new Error("error")));

    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
    expect(mockIsBlockedUser).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Internal server error",
        detail: "Could not create user using session storage: error",
      })
    );
  });

  it("should return 500 when the session token created is of the wrong type", async () => {
    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockLCFastLogin.mockResolvedValueOnce(
      E.right({ status: 200, value: validFastLoginLCResponse })
    );
    mockIsBlockedUser.mockResolvedValueOnce(E.right(false));
    mockSet.mockReturnValueOnce(E.right(true));
    pipe(
      RNEA.range(0, 6),
      RNEA.map(() => mockGetNewToken.mockResolvedValueOnce(""))
    );

    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
    expect(mockIsBlockedUser).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockGetNewToken).toHaveBeenCalledTimes(7);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Internal server error",
        detail: expect.stringContaining("Could not decode session token"),
      })
    );
  });
});
