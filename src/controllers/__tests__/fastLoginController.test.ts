import RedisSessionStorage from "../../services/redisSessionStorage";
import * as E from "fp-ts/lib/Either";
import * as RNEA from "fp-ts/lib/ReadonlyNonEmptyArray";
import * as redis from "redis";
import { aFiscalCode } from "../../__mocks__/user_mock";
import TokenService from "../../services/tokenService";
import { AssertionTypeEnum } from "../../../generated/lollipop-api/AssertionType";
import { fastLoginEndpoint } from "../fastLoginController";
import { Second } from "@pagopa/ts-commons/lib/units";
import { getFastLoginLollipopConsumerClient } from "../../clients/fastLoginLollipopConsumerClient";
import {
  aLollipopOriginalUrl,
  anAssertionRef,
  aSignature,
  aSignatureInput,
} from "../../__mocks__/lollipop";
import { LollipopMethodEnum } from "../../../generated/lollipop/LollipopMethod";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { LollipopLocalsType } from "../../types/lollipop";
import { LollipopJWTAuthorization } from "../../../generated/fast-login-api/LollipopJWTAuthorization";
import { LollipopPublicKey } from "../../../generated/fast-login-api/LollipopPublicKey";
import {
  BPDToken,
  FIMSToken,
  MyPortalToken,
  SessionToken,
  WalletToken,
  ZendeskToken,
} from "../../types/token";
import { aSAMLResponse } from "../../utils/__mocks__/spid";
import { FastLoginResponse as LCFastLoginResponse } from "../../../generated/fast-login-api/FastLoginResponse";
import { BadRequest } from "../../../generated/fast-login-api/BadRequest";
import * as spidUtils from "../../utils/spid";
import { pipe } from "fp-ts/lib/function";
import { UserWithoutTokens } from "../../types/user";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";

const mockSet = jest.fn();
const mockDel = jest.fn();
const mockIsBlockedUser = jest.fn();
jest.mock("../../services/redisSessionStorage", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      del: mockDel,
      isBlockedUser: mockIsBlockedUser,
      set: mockSet,
    })),
  };
});

const aRandomToken = "RANDOMTOKEN";
const mockGetNewToken = jest.fn().mockResolvedValue(aRandomToken);
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getNewTokenAsync: () => Promise.resolve(mockGetNewToken()),
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

const validFastLoginControllerResponse = {
  token: aRandomToken as SessionToken,
};
const validFastLoginLCResponse = {
  saml_response: aSAMLResponse,
} as LCFastLoginResponse;

const mockLCFastLogin = jest
  .fn()
  .mockResolvedValue(E.right({ status: 200, value: validFastLoginLCResponse }));
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
      session_token: aRandomToken as SessionToken,
      bpd_token: aRandomToken as BPDToken,
      fims_token: aRandomToken as FIMSToken,
      wallet_token: aRandomToken as WalletToken,
      zendesk_token: aRandomToken as ZendeskToken,
      myportal_token: aRandomToken as MyPortalToken,
      created_at: expect.any(Number),
      date_of_birth: "1970-01-01",
      family_name: "AgID",
      fiscal_code: expect.any(String),
      name: "SpidValidator",
      session_tracking_id: aRandomToken,
      spid_email: "spid.tech@agid.gov.it",
      spid_idp: "http://localhost:8080",
      spid_level: SpidLevelEnum["https://www.spid.gov.it/SpidL2"],
    };
    mockIsBlockedUser.mockResolvedValueOnce(E.right(false));
    mockSet.mockResolvedValueOnce(E.right(true));
    const expectedClientIp = "10.0.0.2";

    const response = await controller(
      mockReq({ ip: expectedClientIp }),
      fastLoginLollipopLocals
    );
    const res = mockRes();
    response.apply(res);

    expect(mockLCFastLogin).toHaveBeenCalledTimes(1);
    expect(mockLCFastLogin).toHaveBeenCalledWith({
      ...fastLoginLollipopLocals,
      ["x-pagopa-lv-client-ip"]: expectedClientIp,
    });

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

  it("should fail when the lollipop consumer can't be contacted", async () => {
    mockLCFastLogin.mockRejectedValueOnce(null);
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

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
    mockLCFastLogin.mockResolvedValueOnce(BadRequest.decode({}));
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

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
    mockLCFastLogin.mockResolvedValueOnce(E.right({ status: 401 }));
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

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
      mockLCFastLogin.mockResolvedValueOnce(
        E.right({ status: status, value: { detail: "error", title: "error" } })
      );
      const response = await controller(mockReq(), fastLoginLollipopLocals);
      const res = mockRes();
      response.apply(res);

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
    mockLCFastLogin.mockResolvedValueOnce(
      E.right({ status: 200, value: { saml_response: "" } })
    );
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

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
    mockIsBlockedUser.mockResolvedValueOnce(E.right(true));
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

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
    mockIsBlockedUser.mockResolvedValueOnce(E.left(new Error("error")));
    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

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

    mockIsBlockedUser.mockResolvedValueOnce(E.right(false));
    makeProxyUser.mockReturnValueOnce(UserWithoutTokens.decode({}));

    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

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
    mockIsBlockedUser.mockResolvedValueOnce(E.right(false));
    mockSet.mockReturnValueOnce(E.left(new Error("error")));

    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

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
    mockIsBlockedUser.mockResolvedValueOnce(E.right(false));
    mockSet.mockReturnValueOnce(E.right(true));
    pipe(
      RNEA.range(0, 6),
      RNEA.map(() => mockGetNewToken.mockResolvedValueOnce(""))
    );

    const response = await controller(mockReq(), fastLoginLollipopLocals);
    const res = mockRes();
    response.apply(res);

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

  it("should return 500 when the user IP has an unexpected value", async () => {
    const response = await controller(
      mockReq({ ip: "unexpected" }),
      fastLoginLollipopLocals
    );
    const res = mockRes();
    response.apply(res);

    expect(mockLCFastLogin).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Internal server error",
        detail: "Unexpected value for client IP",
      })
    );
  });
});
