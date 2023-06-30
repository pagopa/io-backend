import RedisSessionStorage from "../../services/redisSessionStorage";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as redis from "redis";
import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
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

const mockGetProfile = jest.fn();
const mockCreateProfile = jest.fn();

jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createProfile: mockCreateProfile,
      getProfile: mockGetProfile,
    })),
  };
});

jest.mock("../../services/notificationService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      deleteInstallation: () =>
        Promise.resolve(ResponseSuccessJson({ message: "ok" })),
    })),
  };
});

jest.mock("../../services/usersLoginLogService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      notifyUserLogin: () => Promise.resolve(),
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

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(validFastLoginControllerResponse);
  });
});
