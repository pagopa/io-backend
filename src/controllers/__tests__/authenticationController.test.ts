import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { UrlFromString, ValidUrl } from "@pagopa/ts-commons/lib/url";
import * as lolex from "lolex";
import { NewProfile } from "@pagopa/io-functions-app-sdk/NewProfile";
import {
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponsePermanentRedirect,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { sha256 } from "@pagopa/io-functions-commons/dist/src/utils/crypto";
import { UserIdentity } from "../../../generated/auth/UserIdentity";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import {
  mockedUser,
  aTimestamp,
  aFiscalCode,
  aValidName,
  aValidFamilyname,
  aValidDateofBirth,
  aValidSpidLevel,
  mockSessionToken,
  mockWalletToken,
  mockMyPortalToken,
  mockBPDToken,
  mockZendeskToken,
  aSpidEmailAddress,
  aSessionTrackingId,
  mockFIMSToken,
  mockedInitializedProfile,
} from "../../__mocks__/user_mock";
import ApiClientFactory from "../../services/apiClientFactory";
import NotificationService from "../../services/notificationService";
import ProfileService from "../../services/profileService";
import RedisSessionStorage from "../../services/redisSessionStorage";
import TokenService from "../../services/tokenService";
import UsersLoginLogService from "../../services/usersLoginLogService";
import { SpidUser, exactUserIdentityDecode } from "../../types/user";
import AuthenticationController, {
  AGE_LIMIT,
  AGE_LIMIT_ERROR_CODE,
} from "../authenticationController";
import { addDays, addMonths, format, subYears } from "date-fns";
import { getClientErrorRedirectionUrl } from "../../config";
import * as appInsights from "applicationinsights";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";
import LollipopService from "../../services/lollipopService";
import { LollipopApiClient } from "../../clients/lollipop";
import { ActivatedPubKey } from "../../../generated/lollipop-api/ActivatedPubKey";
import { PubKeyStatusEnum } from "../../../generated/lollipop-api/PubKeyStatus";
import { AssertionRef } from "../../../generated/lollipop-api/AssertionRef";
import { AssertionTypeEnum } from "../../../generated/lollipop-api/AssertionType";
import { JwkPubKey } from "../../../generated/lollipop-api/JwkPubKey";
import {
  aLollipopAssertion,
  aSpidL3LollipopAssertion,
  anAssertionRef,
  anotherAssertionRef,
  lollipopData,
} from "../../__mocks__/lollipop";
import * as authCtrl from "../authenticationController";
import * as config from "../../config";
import { withoutUndefinedValues } from "@pagopa/ts-commons/lib/types";
import { LoginTypeEnum } from "../../utils/fastLogin";
import {
  IDP_NAMES,
  Issuer,
  SPID_IDP_IDENTIFIERS,
  CIE_IDP_IDENTIFIERS,
} from "@pagopa/io-spid-commons/dist/config";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";

import {
  AuthenticationLockServiceMock,
  isUserAuthenticationLockedMock,
} from "../../__mocks__/services.mock";
import { mockRedisClientSelector } from "../../__mocks__/redis";

const req = mockReq();
req.ip = "127.0.0.2";

const aValidEntityID = Object.keys(SPID_IDP_IDENTIFIERS)[0] as Issuer;
const expectedIdPName = IDP_NAMES[aValidEntityID];

// validUser has all every field correctly set.
const validUserPayload = {
  authnContextClassRef: aValidSpidLevel,
  email: aSpidEmailAddress,
  familyName: aValidFamilyname,
  fiscalNumber: aFiscalCode,
  issuer: aValidEntityID,
  dateOfBirth: aValidDateofBirth,
  name: aValidName,
  getAcsOriginalRequest: () => req,
  getAssertionXml: () => aLollipopAssertion,
  getSamlResponseXml: () => aLollipopAssertion,
};
// validSpidL3User has all every field correctly set.
const validSpidL3UserPayload = {
  authnContextClassRef: SpidLevelEnum["https://www.spid.gov.it/SpidL3"],
  email: aSpidEmailAddress,
  familyName: aValidFamilyname,
  fiscalNumber: aFiscalCode,
  issuer: aValidEntityID,
  dateOfBirth: aValidDateofBirth,
  name: aValidName,
  getAcsOriginalRequest: () => req,
  getAssertionXml: () => aSpidL3LollipopAssertion,
  getSamlResponseXml: () => aSpidL3LollipopAssertion,
};
// invalidUser lacks the required familyName and optional email fields.
const invalidUserPayload = {
  authnContextClassRef: aValidSpidLevel,
  fiscalNumber: aFiscalCode,
  getAcsOriginalRequest: () => undefined,
  getAssertionXml: () => "",
  getSamlResponseXml: () => "",
  issuer: aValidEntityID,
  dateOfBirth: aValidDateofBirth,
  name: aValidName,
};

const anotherFiscalCode = "AAABBB01C02D345Z" as FiscalCode;

const anErrorResponse = {
  detail: undefined,
  status: 500,
  title: "Internal server error",
  type: undefined,
};

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined,
};

const mockSet = jest.fn();
const mockGetBySessionToken = jest.fn();
const mockGetByWalletToken = jest.fn();
const mockDel = jest.fn();
const mockDelLollipop = jest.fn();
const mockGetLollipop = jest.fn();
const mockSetLollipop = jest.fn();
const mockSetLollipopData = jest
  .fn()
  .mockImplementation((_, __, ___) => Promise.resolve(E.right(true)));
const mockIsBlockedUser = jest.fn();
jest.mock("../../services/redisSessionStorage", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      del: mockDel,
      getLollipopAssertionRefForUser: mockGetLollipop,
      delLollipopDataForUser: mockDelLollipop,
      setLollipopDataForUser: mockSetLollipopData,
      setLollipopAssertionRefForUser: mockSetLollipop,
      getBySessionToken: mockGetBySessionToken,
      getByWalletToken: mockGetByWalletToken,
      isBlockedUser: mockIsBlockedUser,
      set: mockSet,
    })),
  };
});

mockDelLollipop.mockImplementation(() => Promise.resolve(E.right(true)));

const mockGetNewToken = jest.fn();
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

jest
  .spyOn(config, "isUserElegibleForFastLogin")
  .mockImplementation((_) => false);

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

const mockOnUserLogin = jest.fn().mockImplementation(() => TE.of(true));
const expectedUserLoginData = {
  email: mockedInitializedProfile.email,
  family_name: mockedInitializedProfile.family_name,
  fiscal_code: mockedInitializedProfile.fiscal_code,
  identity_provider: expectedIdPName,
  // TODO change
  ip_address: "127.0.0.2",
  name: mockedInitializedProfile.name,
  is_email_validated: mockedInitializedProfile.is_email_validated,
};

jest.mock("../../services/lollipopService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      revokePreviousAssertionRef: mockRevokePreviousAssertionRef,
      activateLolliPoPKey: mockActivateLolliPoPKey,
    })),
  };
});

const mockTelemetryClient = {
  trackEvent: jest.fn(),
} as unknown as appInsights.TelemetryClient;

const tokenService = new TokenService();

const tokenDurationSecs = 3600 * 24 * 30;
const lvTokenDurationSecs = 60 * 1;
const lvLongSessionDurationSecs = 3600 * 24 * 365;

const aDefaultLollipopAssertionRefDurationSec = (3600 * 24 * 365 * 2) as Second;
const redisSessionStorage = new RedisSessionStorage(
  mockRedisClientSelector,
  tokenDurationSecs,
  aDefaultLollipopAssertionRefDurationSec
);

const getClientProfileRedirectionUrl = (token: string): UrlFromString => {
  const url = "https://localhost/profile.html?token={token}".replace(
    "{token}",
    token
  );
  return {
    href: url,
  } as UrlFromString;
};

const api = new ApiClientFactory("", "");
const profileService = new ProfileService(api);

const lollipopService = new LollipopService(
  {} as ReturnType<LollipopApiClient>,
  "",
  ""
);
const notificationService = new NotificationService("", "");
const notificationServiceFactory = (_fiscalCode: FiscalCode) =>
  notificationService;
const usersLoginLogService = new UsersLoginLogService("", "");

const controller = new AuthenticationController(
  redisSessionStorage,
  tokenService,
  getClientProfileRedirectionUrl,
  getClientErrorRedirectionUrl,
  profileService,
  AuthenticationLockServiceMock,
  notificationServiceFactory,
  usersLoginLogService,
  mockOnUserLogin,
  true,
  {
    isLollipopEnabled: false,
    lollipopService: lollipopService,
  },
  tokenDurationSecs as Second,
  lvTokenDurationSecs as Second,
  lvLongSessionDurationSecs as Second,
  [validUserPayload.fiscalNumber],
  mockTelemetryClient
);

const lollipopActivatedController = new AuthenticationController(
  redisSessionStorage,
  tokenService,
  getClientProfileRedirectionUrl,
  getClientErrorRedirectionUrl,
  profileService,
  AuthenticationLockServiceMock,
  notificationServiceFactory,
  usersLoginLogService,
  mockOnUserLogin,
  true,
  {
    isLollipopEnabled: true,
    lollipopService: lollipopService,
  },
  tokenDurationSecs as Second,
  lvTokenDurationSecs as Second,
  lvLongSessionDurationSecs as Second,
  [validUserPayload.fiscalNumber],
  mockTelemetryClient
);

let clock: any;
beforeEach(() => {
  // We need to mock time to test token expiration.
  clock = lolex.install({ now: aTimestamp });

  jest.clearAllMocks();
});
afterEach(() => {
  clock = clock.uninstall();
});

const setupGetNewTokensMocks = () => {
  mockGetNewToken
    .mockReturnValueOnce(mockSessionToken)
    .mockReturnValueOnce(mockWalletToken)
    .mockReturnValueOnce(mockMyPortalToken)
    .mockReturnValueOnce(mockBPDToken)
    .mockReturnValueOnce(mockZendeskToken)
    .mockReturnValueOnce(mockFIMSToken)
    .mockReturnValueOnce(aSessionTrackingId);
};

describe("AuthenticationController#acs", () => {
  it("redirects to the correct url if userPayload is a valid User and a profile not exists", async () => {
    const res = mockRes();
    const expectedNewProfile: NewProfile = {
      email: validUserPayload.email,
      is_email_validated: false,
      is_test_profile: false,
    };

    mockSet.mockReturnValue(Promise.resolve(E.right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    setupGetNewTokensMocks();

    mockGetProfile.mockReturnValue(
      ResponseErrorNotFound("Not Found.", "Profile not found")
    );
    mockCreateProfile.mockReturnValue(
      ResponseSuccessJson(mockedInitializedProfile)
    );
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining("/profile.html?token=" + mockSessionToken)
    );
    expect(mockSet).toHaveBeenCalledWith(mockedUser, tokenDurationSecs);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).toHaveBeenCalledWith(
      mockedUser,
      expectedNewProfile
    );
    expect(mockOnUserLogin).not.toHaveBeenCalled();
  });

  it("redirects to the correct url if userPayload is a valid User and a profile exists", async () => {
    const res = mockRes();

    mockSet.mockReturnValue(Promise.resolve(E.right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    setupGetNewTokensMocks();

    mockGetProfile.mockReturnValue(
      ResponseSuccessJson(mockedInitializedProfile)
    );
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining("/profile.html?token=" + mockSessionToken)
    );
    expect(mockSet).toHaveBeenCalledWith(mockedUser, tokenDurationSecs);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).not.toBeCalled();

    expect(mockOnUserLogin).not.toHaveBeenCalled();
  });

  it("should fail if a profile cannot be created", async () => {
    const res = mockRes();
    const expectedNewProfile: NewProfile = {
      email: validUserPayload.email,
      is_email_validated: false,
      is_test_profile: false,
    };

    mockSet.mockReturnValue(Promise.resolve(E.right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    setupGetNewTokensMocks();

    mockGetProfile.mockReturnValue(
      ResponseErrorNotFound("Not Found.", "Profile not found")
    );
    mockCreateProfile.mockReturnValue(
      ResponseErrorInternal("Error creating new user profile")
    );
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(mockSet).toHaveBeenCalledWith(mockedUser, tokenDurationSecs);

    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).toHaveBeenCalledWith(
      mockedUser,
      expectedNewProfile
    );
    expect(mockOnUserLogin).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "IResponseErrorInternal",
    });
  });

  it("should fail if an error occours checking the profile", async () => {
    const res = mockRes();

    mockSet.mockReturnValue(Promise.resolve(E.right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    setupGetNewTokensMocks();

    mockGetProfile.mockReturnValue(
      ResponseErrorInternal("Error reading the user profile")
    );
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(mockSet).toHaveBeenCalledWith(mockedUser, tokenDurationSecs);

    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).not.toHaveBeenCalled();
    expect(mockOnUserLogin).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "IResponseErrorInternal",
    });
  });

  it("should fail if userPayload is invalid", async () => {
    const res = mockRes();
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    const response = await controller.acs(invalidUserPayload);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("should fail if the session can not be saved", async () => {
    mockSet.mockReturnValue(Promise.resolve(E.right(false)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    const res = mockRes();

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error creating the user session",
    });
  });

  it("should return Unathorized if user is blocked", async () => {
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(true)));
    const res = mockRes();

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should fail if Redis Client returns an error while getting info on user blocked", async () => {
    mockIsBlockedUser.mockReturnValue(
      Promise.resolve(E.left(new Error("Redis error")))
    );
    const res = mockRes();

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error while validating user",
    });
  });

  it("should fail if Redis client returns an error", async () => {
    mockSet.mockReturnValue(Promise.resolve(E.left(new Error("Redis error"))));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    const res = mockRes();

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error while creating the user session",
    });
  });

  it(`should return unauthorized if the user is younger than ${AGE_LIMIT} yo`, async () => {
    const res = mockRes();

    const aYoungUserPayload: SpidUser = {
      ...validUserPayload,
      dateOfBirth: format(
        addDays(subYears(new Date(), AGE_LIMIT), 1),
        "YYYY-MM-DD"
      ),
    };
    const response = await controller.acs(aYoungUserPayload);
    response.apply(res);

    expect(mockTelemetryClient.trackEvent).toBeCalledWith(
      expect.objectContaining({
        name: "spid.error.generic",
        properties: {
          message: expect.any(String),
          type: "INFO",
        },
      })
    );
    expect(mockSet).not.toBeCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining(`/error.html?errorCode=${AGE_LIMIT_ERROR_CODE}`)
    );
  });

  it(`should return unauthorized if the user is younger than ${AGE_LIMIT} yo with CIE date format`, async () => {
    const res = mockRes();

    const limitDate = subYears(new Date(), AGE_LIMIT);
    const dateOfBirth =
      limitDate.getDate() > 8 ? addDays(limitDate, 1) : addMonths(limitDate, 1);

    const aYoungUserPayload: SpidUser = {
      ...validUserPayload,
      dateOfBirth: format(dateOfBirth, "YYYY-MM-D"),
    };
    const response = await controller.acs(aYoungUserPayload);
    response.apply(res);

    expect(mockTelemetryClient.trackEvent).toBeCalledWith(
      expect.objectContaining({
        name: "spid.error.generic",
        properties: {
          message: expect.any(String),
          type: "INFO",
        },
      })
    );
    expect(mockSet).not.toBeCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining(`/error.html?errorCode=${AGE_LIMIT_ERROR_CODE}`)
    );
  });

  it(`should redirects to the correct url if the user has ${AGE_LIMIT} yo`, async () => {
    const res = mockRes();
    const expectedNewProfile: NewProfile = {
      email: validUserPayload.email,
      is_email_validated: false,
      is_test_profile: false,
    };

    mockSet.mockReturnValue(Promise.resolve(E.right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    setupGetNewTokensMocks();

    mockGetProfile.mockReturnValue(
      ResponseErrorNotFound("Not Found.", "Profile not found")
    );
    mockCreateProfile.mockReturnValue(
      ResponseSuccessJson(mockedInitializedProfile)
    );
    const aYoungUserPayload: SpidUser = {
      ...validUserPayload,
      dateOfBirth: format(subYears(new Date(), AGE_LIMIT), "YYYY-MM-DD"),
    };
    const response = await controller.acs(aYoungUserPayload);
    response.apply(res);

    expect(mockTelemetryClient.trackEvent).not.toBeCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining("/profile.html?token=" + mockSessionToken)
    );
    expect(mockSet).toHaveBeenCalledWith(
      {
        ...mockedUser,
        date_of_birth: aYoungUserPayload.dateOfBirth,
      },
      tokenDurationSecs
    );
    expect(mockGetProfile).toHaveBeenCalledWith({
      ...mockedUser,
      date_of_birth: aYoungUserPayload.dateOfBirth,
    });
    expect(mockCreateProfile).toHaveBeenCalledWith(
      {
        ...mockedUser,
        date_of_birth: aYoungUserPayload.dateOfBirth,
      },
      expectedNewProfile
    );
  });

  it(`redirects to the correct url using the lollipop features`, async () => {
    const res = mockRes();

    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockActivateLolliPoPKey.mockImplementationOnce((newAssertionRef, __, ___) =>
      TE.of({
        ...anActivatedPubKey,
        assertion_ref: newAssertionRef,
      } as ActivatedPubKey)
    );
    mockSetLollipop.mockImplementationOnce((_, __, ___) =>
      Promise.resolve(E.right(true))
    );
    mockSet.mockReturnValue(Promise.resolve(E.right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    setupGetNewTokensMocks();

    mockGetProfile.mockReturnValue(
      ResponseSuccessJson(mockedInitializedProfile)
    );

    const response = await lollipopActivatedController.acs(
      validUserPayload,
      req
    );
    response.apply(res);

    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining("/profile.html?token=" + mockSessionToken)
    );

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockGetLollipop).toBeCalledWith(aFiscalCode);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalledWith(anAssertionRef);
    expect(mockDelLollipop).toBeCalledWith(aFiscalCode);
    expect(mockActivateLolliPoPKey).toBeCalledWith(
      anotherAssertionRef,
      aFiscalCode,
      aLollipopAssertion,
      expect.any(Function)
    );
    expect(mockSetLollipop).toBeCalledWith(
      expect.objectContaining({
        fiscal_code: aFiscalCode,
      }),
      lollipopData.assertionRef,
      tokenDurationSecs
    );

    expect(mockSet).toHaveBeenCalledWith(mockedUser, tokenDurationSecs);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).not.toBeCalled();
  });

  it.each`
    scenario                      | setLollipopAssertionRefForUserResponse      | errorMessage
    ${"with false response"}      | ${() => Promise.resolve(E.right(false))}    | ${"Error creating CF - assertion ref relation in redis"}
    ${"with left response"}       | ${() => Promise.resolve(E.left("Error"))}   | ${undefined}
    ${"with a promise rejection"} | ${() => Promise.reject(new Error("Error"))} | ${"Error"}
  `(
    "should fail if an error occours saving assertionRef for user in redis $scenario",
    async ({ setLollipopAssertionRefForUserResponse, errorMessage }) => {
      const res = mockRes();

      mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
      mockDelLollipop.mockResolvedValueOnce(E.right(true));
      mockActivateLolliPoPKey.mockImplementationOnce(
        (newAssertionRef, __, ___) =>
          TE.of({
            ...anActivatedPubKey,
            assertion_ref: newAssertionRef,
          } as ActivatedPubKey)
      );
      mockSetLollipop.mockImplementationOnce((_, __, ___) =>
        setLollipopAssertionRefForUserResponse()
      );

      mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
      setupGetNewTokensMocks();

      const response = await lollipopActivatedController.acs(
        validUserPayload,
        req
      );
      response.apply(res);

      expect(mockTelemetryClient.trackEvent).toHaveBeenCalledWith({
        name: "lollipop.error.acs",
        properties: expect.objectContaining({
          assertion_ref: anotherAssertionRef,
          fiscal_code: sha256(aFiscalCode),
          message: errorMessage,
        }),
      });

      expect(res.status).toHaveBeenCalledWith(500);
      expect(response).toEqual({
        apply: expect.any(Function),
        detail: "Internal server error: Error Activation Lollipop Key",
        kind: "IResponseErrorInternal",
      });

      expect(mockGetLollipop).toHaveBeenCalledTimes(1);
      expect(mockGetLollipop).toBeCalledWith(aFiscalCode);
      expect(mockRevokePreviousAssertionRef).toHaveBeenCalledWith(
        anAssertionRef
      );
      expect(mockDelLollipop).toBeCalledWith(aFiscalCode);
      expect(mockActivateLolliPoPKey).toBeCalledWith(
        anotherAssertionRef,
        aFiscalCode,
        aLollipopAssertion,
        expect.any(Function)
      );
      expect(mockSetLollipop).toBeCalledWith(
        expect.objectContaining({
          fiscal_code: aFiscalCode,
        }),
        lollipopData.assertionRef,
        tokenDurationSecs
      );

      expect(mockSet).not.toBeCalled();
      expect(mockGetProfile).not.toBeCalled();
      expect(mockCreateProfile).not.toBeCalled();
      expect(mockOnUserLogin).not.toHaveBeenCalled();
    }
  );

  it(`should fail if an error occours activating a pubkey for lollipop`, async () => {
    const res = mockRes();

    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockActivateLolliPoPKey.mockImplementationOnce((_, __, ___) =>
      TE.left(new Error("Error"))
    );

    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    setupGetNewTokensMocks();

    const response = await lollipopActivatedController.acs(
      validUserPayload,
      req
    );
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: "Internal server error: Error Activation Lollipop Key",
      kind: "IResponseErrorInternal",
    });

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockGetLollipop).toBeCalledWith(aFiscalCode);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalledWith(anAssertionRef);
    expect(mockDelLollipop).toBeCalledWith(aFiscalCode);
    expect(mockActivateLolliPoPKey).toBeCalledWith(
      anotherAssertionRef,
      aFiscalCode,
      aLollipopAssertion,
      expect.any(Function)
    );
    expect(mockSetLollipop).not.toBeCalled();

    expect(mockSet).not.toBeCalled();
    expect(mockGetProfile).not.toBeCalled();
    expect(mockCreateProfile).not.toBeCalled();
    expect(mockOnUserLogin).not.toHaveBeenCalled();
  });

  it.each`
    scenario                      | delLollipopDataForUserResponse                               | errorMessage
    ${"with false response"}      | ${() => Promise.resolve(E.right(false))}                     | ${"Error on LolliPoP initialization"}
    ${"with left response"}       | ${() => Promise.resolve(E.left(new Error("Error on left")))} | ${"Error on left"}
    ${"with a promise rejection"} | ${() => Promise.reject(new Error("Error on reject"))}        | ${"Error on reject"}
  `(
    "should fail if an error occours deleting the previous CF-assertionRef link on redis $scenario",
    async ({ delLollipopDataForUserResponse, errorMessage }) => {
      const res = mockRes();

      mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
      mockDelLollipop.mockImplementationOnce(delLollipopDataForUserResponse);

      mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
      setupGetNewTokensMocks();

      const response = await lollipopActivatedController.acs(
        validUserPayload,
        req
      );
      response.apply(res);

      expect(mockTelemetryClient.trackEvent).toHaveBeenCalledWith({
        name: "lollipop.error.acs",
        properties: expect.objectContaining({
          fiscal_code: sha256(aFiscalCode),
          message: `acs: ${errorMessage}`,
        }),
      });

      expect(res.status).toHaveBeenCalledWith(500);
      expect(response).toEqual({
        apply: expect.any(Function),
        detail: `Internal server error: ${errorMessage}`,
        kind: "IResponseErrorInternal",
      });

      expect(mockGetLollipop).toHaveBeenCalledTimes(1);
      expect(mockGetLollipop).toBeCalledWith(aFiscalCode);
      expect(mockRevokePreviousAssertionRef).toHaveBeenCalledWith(
        anAssertionRef
      );
      expect(mockDelLollipop).toBeCalledWith(aFiscalCode);
      expect(mockActivateLolliPoPKey).not.toBeCalled();
      expect(mockSetLollipop).not.toBeCalled();

      expect(mockSet).not.toBeCalled();
      expect(mockGetProfile).not.toBeCalled();
      expect(mockCreateProfile).not.toBeCalled();
      expect(mockOnUserLogin).not.toHaveBeenCalled();
    }
  );

  it(`should fail if an error occours reading the previous CF-assertionRef link on redis`, async () => {
    const res = mockRes();

    mockGetLollipop.mockResolvedValueOnce(E.left(new Error("Error")));

    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    setupGetNewTokensMocks();

    const response = await lollipopActivatedController.acs(
      validUserPayload,
      req
    );
    response.apply(res);

    expect(mockTelemetryClient.trackEvent).toHaveBeenCalledWith({
      name: "lollipop.error.acs",
      properties: expect.objectContaining({
        fiscal_code: sha256(aFiscalCode),
        message: "Error retrieving previous lollipop configuration",
      }),
    });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail:
        "Internal server error: Error retrieving previous lollipop configuration",
      kind: "IResponseErrorInternal",
    });

    expect(mockGetLollipop).toHaveBeenCalledTimes(1);
    expect(mockGetLollipop).toBeCalledWith(aFiscalCode);
    expect(mockRevokePreviousAssertionRef).not.toBeCalled();
    expect(mockDelLollipop).not.toBeCalled();
    expect(mockActivateLolliPoPKey).not.toBeCalled();
    expect(mockSetLollipop).not.toBeCalled();

    expect(mockSet).not.toBeCalled();
    expect(mockGetProfile).not.toBeCalled();
    expect(mockCreateProfile).not.toBeCalled();
    expect(mockOnUserLogin).not.toHaveBeenCalled();
  });

  it.each`
    isUserElegible | expectedUriScheme
    ${false}       | ${"https:"}
    ${true}        | ${"iologin:"}
  `(
    "should succeed and redirect to the correct URI scheme($expectedUriScheme) when IOLOGIN feature check for the user returns $isUserElegible",
    async ({ isUserElegible, expectedUriScheme }) => {
      jest
        .spyOn(authCtrl, "isUserElegibleForIoLoginUrlScheme")
        .mockImplementationOnce((_) => isUserElegible);

      const res = mockRes();

      mockSet.mockReturnValue(Promise.resolve(E.right(true)));
      mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
      setupGetNewTokensMocks();

      mockGetProfile.mockReturnValue(
        ResponseSuccessJson(mockedInitializedProfile)
      );
      const response = await controller.acs(validUserPayload);
      response.apply(res);

      expect(res.redirect).toHaveBeenCalledWith(
        301,
        expectedUriScheme + "//localhost/profile.html?token=" + mockSessionToken
      );
    }
  );

  it("should return unauthorized using a CIE test environment with no whitelisted user fiscalcode", async () => {
    const anotherFiscalCode = "AAABBB01C02D345Z" as FiscalCode;
    const res = mockRes();
    const anInvalidCieTestUser = {
      ...validUserPayload,
      fiscalNumber: anotherFiscalCode,
      issuer: Object.keys(CIE_IDP_IDENTIFIERS)[0],
    };

    const response = await controller.acs(anInvalidCieTestUser);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it.each`
    title                                        | fiscalNumber                     | issuer
    ${"if a CIE TEST user is in whitelist"}      | ${validUserPayload.fiscalNumber} | ${Object.keys(CIE_IDP_IDENTIFIERS)[0]}
    ${"if a user logs to PROD CIE IDP"}          | ${anotherFiscalCode}             | ${Object.keys(CIE_IDP_IDENTIFIERS)[1]}
    ${"if a user logs to another IDP"}           | ${anotherFiscalCode}             | ${"https://id.eht.eu"}
    ${"if  a CIE TEST user logs to another IDP"} | ${validUserPayload.fiscalNumber} | ${"https://id.eht.eu"}
  `(
    "should redirect to success URL $title",
    async ({ fiscalNumber, issuer }) => {
      const res = mockRes();
      const whitelistedCieTestUserPayload = {
        ...validUserPayload,
        fiscalNumber,
        issuer,
      };

      mockSet.mockReturnValue(Promise.resolve(E.right(true)));
      mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
      mockGetNewToken
        .mockReturnValueOnce(mockSessionToken)
        .mockReturnValueOnce(mockWalletToken)
        .mockReturnValueOnce(mockMyPortalToken)
        .mockReturnValueOnce(mockBPDToken)
        .mockReturnValueOnce(mockZendeskToken)
        .mockReturnValueOnce(mockFIMSToken)
        .mockReturnValueOnce(aSessionTrackingId);

      mockGetProfile.mockReturnValue(
        ResponseErrorNotFound("Not Found.", "Profile not found")
      );
      mockCreateProfile.mockReturnValue(
        ResponseSuccessJson(mockedInitializedProfile)
      );
      const response = await controller.acs(whitelistedCieTestUserPayload);
      response.apply(res);

      expect(res.redirect).toHaveBeenCalledWith(
        301,
        "https://localhost/profile.html?token=" + mockSessionToken
      );
    }
  );

  // this test ensures CIE prod, coll and test URLs are present in the identifiers object.
  // since in the authenticationcontroller we filter the keys based on the prod URL, we ensure here
  // that at least coll and test URLs are in the array, to let the logic work in the controller.
  // instead, if the order of the keys changes, the unit tests above should fail when the library is updated
  it("should verify that the CIE_IDP_IDENTIFIERS urls are present", () => {
    const CIE_IDP_IDENTIFIERS_KEYS = Object.keys(CIE_IDP_IDENTIFIERS);

    const prodUrlFilter = CIE_IDP_IDENTIFIERS_KEYS.filter(
      (k) =>
        k ===
        "https://idserver.servizicie.interno.gov.it/idp/profile/SAML2/POST/SSO"
    );

    // expect prod url to be present
    expect(prodUrlFilter.length).toBe(1);
    // expect at least test and coll urls to be present
    expect(
      CIE_IDP_IDENTIFIERS_KEYS.length - prodUrlFilter.length
    ).toBeGreaterThanOrEqual(2);
  });
});

describe("AuthenticationController|>LV|>acs", () => {
  it.each`
    loginType               | isLollipopEnabled | isUserElegible | expectedTtlDuration    | expectedLongSessionDuration
    ${LoginTypeEnum.LV}     | ${true}           | ${true}        | ${lvTokenDurationSecs} | ${lvLongSessionDurationSecs}
    ${LoginTypeEnum.LV}     | ${true}           | ${false}       | ${tokenDurationSecs}   | ${tokenDurationSecs}
    ${LoginTypeEnum.LEGACY} | ${true}           | ${true}        | ${tokenDurationSecs}   | ${tokenDurationSecs}
    ${LoginTypeEnum.LEGACY} | ${true}           | ${false}       | ${tokenDurationSecs}   | ${tokenDurationSecs}
    ${undefined}            | ${true}           | ${true}        | ${tokenDurationSecs}   | ${tokenDurationSecs}
    ${undefined}            | ${true}           | ${false}       | ${tokenDurationSecs}   | ${tokenDurationSecs}
    ${LoginTypeEnum.LV}     | ${false}          | ${true}        | ${tokenDurationSecs}   | ${tokenDurationSecs}
    ${LoginTypeEnum.LV}     | ${false}          | ${false}       | ${tokenDurationSecs}   | ${tokenDurationSecs}
    ${LoginTypeEnum.LEGACY} | ${false}          | ${true}        | ${tokenDurationSecs}   | ${tokenDurationSecs}
    ${LoginTypeEnum.LEGACY} | ${false}          | ${false}       | ${tokenDurationSecs}   | ${tokenDurationSecs}
    ${undefined}            | ${false}          | ${true}        | ${tokenDurationSecs}   | ${tokenDurationSecs}
    ${undefined}            | ${false}          | ${false}       | ${tokenDurationSecs}   | ${tokenDurationSecs}
  `(
    "should succeed and return a new token with duration $expectedTtlDuration, if lollipop is enabled $isLollipopEnabled, ff is $isUserElegible and login is of type $loginType",
    async ({
      loginType,
      isLollipopEnabled,
      expectedTtlDuration,
      expectedLongSessionDuration,
      isUserElegible,
    }) => {
      const res = mockRes();

      jest
        .spyOn(config, "isUserElegibleForFastLogin")
        .mockImplementationOnce((_) => isUserElegible);

      mockGetLollipop.mockResolvedValueOnce(
        E.right(O.some(anotherAssertionRef))
      );
      mockDelLollipop.mockResolvedValueOnce(E.right(true));
      mockActivateLolliPoPKey.mockImplementationOnce(
        (newAssertionRef, __, ___) =>
          TE.of({
            ...anActivatedPubKey,
            assertion_ref: newAssertionRef,
          } as ActivatedPubKey)
      );

      if (!isUserElegible)
        mockSetLollipop.mockImplementationOnce((_, __, ___) =>
          Promise.resolve(E.right(true))
        );

      mockSet.mockReturnValue(Promise.resolve(E.right(true)));
      mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));

      setupGetNewTokensMocks();

      mockGetProfile.mockReturnValue(
        ResponseSuccessJson(mockedInitializedProfile)
      );

      const controllerToUse = isLollipopEnabled
        ? lollipopActivatedController
        : controller;

      const response = await controllerToUse.acs(
        validUserPayload,
        withoutUndefinedValues({
          loginType,
        })
      );
      response.apply(res);

      expect(mockSet).toHaveBeenCalledWith(mockedUser, expectedTtlDuration);

      if (isLollipopEnabled) {
        if (isUserElegible) {
          expect(mockSetLollipopData).toHaveBeenCalledWith(
            mockedUser,
            {
              ...lollipopData,
              loginType: loginType ? loginType : LoginTypeEnum.LEGACY,
            },
            expectedLongSessionDuration
          );
        } else {
          expect(mockSetLollipop).toHaveBeenCalledWith(
            mockedUser,
            lollipopData.assertionRef,
            expectedLongSessionDuration
          );
        }
        expect(mockActivateLolliPoPKey).toHaveBeenCalledWith(
          anotherAssertionRef,
          mockedUser.fiscal_code,
          aLollipopAssertion,
          expect.any(Function)
        );

        if (isUserElegible) {
          expect(mockOnUserLogin).toHaveBeenCalledWith(expectedUserLoginData);
        } else {
          expect(mockOnUserLogin).not.toHaveBeenCalled();
        }

        const ttlToExpirationDate = mockActivateLolliPoPKey.mock.calls[0][3];

        const now = new Date();
        const exp = ttlToExpirationDate() as Date;
        const diff = (exp.getTime() - now.getTime()) / 1000;

        expect(diff).toEqual(expectedLongSessionDuration);
      } else {
        expect(mockSetLollipop).not.toHaveBeenCalled();
        expect(mockActivateLolliPoPKey).not.toHaveBeenCalled();
        expect(mockOnUserLogin).not.toHaveBeenCalled();
      }

      expect(res.redirect).toHaveBeenCalledWith(
        301,
        expect.stringContaining("/profile.html?token=" + mockSessionToken)
      );
    }
  );

  it("should return a new token when user is eligible for LV and login level === SpidL3", async () => {
    const res = mockRes();

    jest
      .spyOn(config, "isUserElegibleForFastLogin")
      .mockImplementationOnce((_) => true);

    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));

    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anotherAssertionRef)));
    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockActivateLolliPoPKey.mockImplementationOnce((newAssertionRef, __, ___) =>
      TE.of({
        ...anActivatedPubKey,
        assertion_ref: newAssertionRef,
      } as ActivatedPubKey)
    );

    mockSet.mockReturnValue(Promise.resolve(E.right(true)));

    setupGetNewTokensMocks();

    mockGetProfile.mockReturnValue(
      ResponseSuccessJson(mockedInitializedProfile)
    );
    const response = await controller.acs(validSpidL3UserPayload);
    response.apply(res);

    expect(isUserAuthenticationLockedMock).not.toHaveBeenCalled();

    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining("/profile.html?token=" + mockSessionToken)
    );
  });

  it("should return a new token when user is NOT eligible for LV, regardless of the auth lock status", async () => {
    const res = mockRes();

    mockIsBlockedUser.mockReturnValueOnce(Promise.resolve(E.right(false)));
    isUserAuthenticationLockedMock.mockReturnValueOnce(TE.of(true));

    jest
      .spyOn(config, "isUserElegibleForFastLogin")
      .mockImplementationOnce((_) => false);

    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anotherAssertionRef)));
    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockActivateLolliPoPKey.mockImplementationOnce((newAssertionRef, __, ___) =>
      TE.of({
        ...anActivatedPubKey,
        assertion_ref: newAssertionRef,
      } as ActivatedPubKey)
    );

    mockSet.mockReturnValue(Promise.resolve(E.right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));

    setupGetNewTokensMocks();

    mockGetProfile.mockReturnValue(
      ResponseSuccessJson(mockedInitializedProfile)
    );

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining("/profile.html?token=" + mockSessionToken)
    );
  });

  it("should redirect to error page with `AUTHENTICATION_LOCKED_ERROR` code when user is eligible for LV, user auth is locked and login level < SpidL3", async () => {
    const res = mockRes();

    jest
      .spyOn(config, "isUserElegibleForFastLogin")
      .mockImplementationOnce((_) => true);

    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    isUserAuthenticationLockedMock.mockReturnValueOnce(TE.of(true));

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining(
        `/error.html?errorCode=${authCtrl.AUTHENTICATION_LOCKED_ERROR}`
      )
    );
  });
});

describe("AuthenticationController|>LV|>acs|>notify user login", () => {
  const setupLollipopScenario = () => {
    jest.spyOn(config, "isUserElegibleForFastLogin").mockReturnValueOnce(true);

    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anotherAssertionRef)));
    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockActivateLolliPoPKey.mockImplementationOnce((newAssertionRef, __, ___) =>
      TE.of({
        ...anActivatedPubKey,
        assertion_ref: newAssertionRef,
      } as ActivatedPubKey)
    );
    mockSetLollipop.mockImplementationOnce((_, __, ___) =>
      Promise.resolve(E.right(true))
    );
    mockSet.mockReturnValue(Promise.resolve(E.right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
  };

  it("should notify new login with profile email if profile does not exists and user is eligible", async () => {
    const res = mockRes();

    setupGetNewTokensMocks();
    setupLollipopScenario();
    mockGetProfile.mockReturnValue(
      ResponseErrorNotFound("Not Found.", "Profile not found")
    );
    mockCreateProfile.mockReturnValue(
      ResponseSuccessJson(mockedInitializedProfile)
    );
    const response = await lollipopActivatedController.acs(
      validUserPayload,
      req
    );
    response.apply(res);

    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining("/profile.html?token=" + mockSessionToken)
    );
    expect(mockSet).toHaveBeenCalledWith(mockedUser, tokenDurationSecs);

    expect(mockOnUserLogin).toHaveBeenCalledWith({
      ...expectedUserLoginData,
      // new profile created has always is_email_validated to false
      // with email uniqueness feature
      is_email_validated: false,
      email: validUserPayload.email,
    });
  });

  it("should notify new login with spid email if profile exists, email is not validated and user is eligible", async () => {
    const res = mockRes();

    setupGetNewTokensMocks();
    setupLollipopScenario();
    mockGetProfile.mockReturnValue(
      ResponseSuccessJson({
        ...mockedInitializedProfile,
        is_email_validated: undefined,
      })
    );

    const response = await lollipopActivatedController.acs(
      validUserPayload,
      req
    );
    response.apply(res);

    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining("/profile.html?token=" + mockSessionToken)
    );

    expect(mockOnUserLogin).toHaveBeenCalledWith({
      ...expectedUserLoginData,
      email: validUserPayload.email,
      is_email_validated: undefined,
    });
  });

  it("should delete Lollipop data when onUserLogin call fails", async () => {
    const res = mockRes();

    setupGetNewTokensMocks();
    setupLollipopScenario();

    mockDelLollipop.mockResolvedValueOnce(E.right(true));

    mockOnUserLogin.mockImplementationOnce(() =>
      TE.left(new Error("Error calling notify endpoint"))
    );

    mockGetProfile.mockReturnValue(
      ResponseSuccessJson({
        ...mockedInitializedProfile,
        is_email_validated: undefined,
      })
    );

    const response = await lollipopActivatedController.acs(
      validUserPayload,
      req
    );
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(mockOnUserLogin).toHaveBeenCalled();
    expect(mockDelLollipop).toHaveBeenCalledTimes(2);

    expect(mockTelemetryClient.trackEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: "lollipop.error.acs.notify",
        properties: {
          error: "Error calling notify endpoint",
          fiscal_code: sha256(validUserPayload.fiscalNumber),
          message: "acs: Unable to notify user login event",
        },
      })
    );
  });

  it("should track an event if delete Lollipop data fails when onUserLogin call fails", async () => {
    const res = mockRes();

    setupGetNewTokensMocks();
    setupLollipopScenario();

    mockDelLollipop.mockResolvedValueOnce(
      E.left(new Error("Error deleting Lollipop Data"))
    );

    mockOnUserLogin.mockImplementationOnce(() =>
      TE.left(new Error("Error calling notify endpoint"))
    );

    mockGetProfile.mockReturnValue(
      ResponseSuccessJson({
        ...mockedInitializedProfile,
        is_email_validated: undefined,
      })
    );

    const response = await lollipopActivatedController.acs(
      validUserPayload,
      req
    );
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(mockOnUserLogin).toHaveBeenCalled();
    expect(mockDelLollipop).toHaveBeenCalledTimes(2);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalledTimes(2);
    expect(mockTelemetryClient.trackEvent).toHaveBeenCalledTimes(2);
    expect(mockTelemetryClient.trackEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: "lollipop.error.acs.delete",
        properties: {
          error: "Error deleting Lollipop Data",
          fiscal_code: sha256(validUserPayload.fiscalNumber),
          message:
            "acs: error deleting lollipop data while fallbacking from notify login failure",
        },
      })
    );
  });
});

describe("AuthenticationController#acsTest", () => {
  let acsSpyOn: jest.SpyInstance<
    ReturnType<AuthenticationController["acs"]>,
    jest.ArgsType<AuthenticationController["acs"]>
  >;
  const res = mockRes();
  beforeEach(() => {
    jest.clearAllMocks();
    acsSpyOn = jest.spyOn(controller, "acs");
  });
  afterAll(() => {
    acsSpyOn.mockRestore();
  });
  it("should return ResponseSuccessJson with a valid token if acs succeeded", async () => {
    const expectedToken = "token-111-222";
    acsSpyOn.mockImplementation(async (_: unknown) => {
      return ResponsePermanentRedirect(
        getClientProfileRedirectionUrl(expectedToken)
      );
    });
    const response = await controller.acsTest(validUserPayload);
    response.apply(res);

    expect(response.kind).toEqual("IResponseSuccessJson");
    expect(res.json).toHaveBeenCalledWith({ token: expectedToken });
  });
  it("should return the same response of acs if is different from SuccessPermanentRedirect", async () => {
    const expectedResponse = ResponseErrorValidation(
      "Validation error",
      "Validation error message"
    );
    acsSpyOn.mockImplementation(async (_: unknown) => expectedResponse);
    const response = await controller.acsTest(validUserPayload);
    response.apply(res);

    expect(response).toEqual(expectedResponse);
  });
  it("should return ResponseErrorInternal if the token is missing", async () => {
    acsSpyOn.mockImplementation(async (_: unknown) => {
      return ResponsePermanentRedirect({
        href: "https://invalid-url",
      } as ValidUrl);
    });
    const response = await controller.acsTest(validUserPayload);
    response.apply(res);

    expect(response.kind).toEqual("IResponseErrorInternal");
  });
});

describe("AuthenticationController#getUserIdentity", () => {
  let mockUserDecode: jest.SpyInstance | undefined;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterEach(() => {
    if (mockUserDecode !== undefined) {
      mockUserDecode.mockRestore();
    }
  });

  it("shoud return a success response with the User Identity", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    const response = await controller.getUserIdentity(req);
    response.apply(res);

    const expectedValue = exactUserIdentityDecode(
      mockedUser as unknown as UserIdentity
    );
    expect(E.isRight(expectedValue)).toBeTruthy();
    if (E.isRight(expectedValue)) {
      expect(response).toEqual({
        apply: expect.any(Function),
        kind: "IResponseSuccessJson",
        value: expectedValue.right,
      });
    }
  });

  it("should fail if the User object doesn't match UserIdentity decoder contraints", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = invalidUserPayload;

    // Emulate a successfully User decode and a failure on UserIdentity decode
    const user = require("../../types/user").User;
    mockUserDecode = jest
      .spyOn(user, "decode")
      .mockImplementation((_: unknown) => E.right(_));

    const response = await controller.getUserIdentity(req);
    response.apply(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: "Internal server error: Unexpected User Identity data format.",
      kind: "IResponseErrorInternal",
    });
  });
});

describe("AuthenticationController#slo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to the home page", async () => {
    const res = mockRes();

    const response = await controller.slo();
    response.apply(res);

    expect(res.redirect).toHaveBeenCalledWith(301, "/");
  });
});

describe("AuthenticationController|>LollipopDisabled|>logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("should return success after deleting session token and wallet token", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockDel.mockResolvedValueOnce(E.right(true));

    const response = await controller.logout(req);
    response.apply(res);

    expect(mockGetLollipop).not.toHaveBeenCalled();
    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockDel).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" },
    });
  });

  it("should return success after deleting all auth tokens", async () => {
    const res = mockRes();
    const req = mockReq();
    const userWithExternalToken = {
      ...mockedUser,
      bpd_token: mockBPDToken,
      myportal_token: mockMyPortalToken,
      zendesk_token: mockZendeskToken,
    };
    req.user = userWithExternalToken;

    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockDel.mockResolvedValueOnce(E.right(true));

    const response = await controller.logout(req);
    response.apply(res);

    expect(mockGetLollipop).not.toHaveBeenCalled();
    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockDel).toHaveBeenCalledWith(userWithExternalToken);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" },
    });
  });

  it("should fail if the generation user data is invalid", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = invalidUserPayload;

    const response = await controller.logout(req);
    response.apply(res);

    expect(mockGetLollipop).not.toHaveBeenCalled();
    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).not.toHaveBeenCalled();
    expect(mockDel).not.toBeCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should fail if the assertionRef can not be deleted for a redis error", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockDelLollipop.mockResolvedValueOnce(E.left(new Error("Redis error")));

    const response = await controller.logout(req);
    response.apply(res);

    expect(mockGetLollipop).not.toHaveBeenCalled();
    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockDel).not.toBeCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Redis error",
    });
  });

  it("should fail if the session can not be destroyed", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockDel.mockResolvedValueOnce(E.right(false));

    const response = await controller.logout(req);
    response.apply(res);

    expect(mockGetLollipop).not.toHaveBeenCalled();
    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockDel).toHaveBeenCalledWith(mockedUser);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error destroying the user session",
    });
  });

  it("should fail if Redis client returns an error", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockDel.mockResolvedValueOnce(E.left(new Error("Redis error")));

    const response = await controller.logout(req);
    response.apply(res);

    expect(mockGetLollipop).not.toHaveBeenCalled();
    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockDel).toHaveBeenCalledWith(mockedUser);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Redis error",
    });
  });
});

describe("AuthenticationController|>LollipopEnabled|>logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it(`
    GIVEN a lollipop enabled flow
    WHEN assertionRef exists on redis
    THEN it should send the pub key revokal message and succeed deleting the assertionRef and the session tokens
  `, async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockRevokePreviousAssertionRef.mockResolvedValueOnce({});
    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockDel.mockResolvedValueOnce(E.right(true));

    const response = await lollipopActivatedController.logout(req);
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledWith(aFiscalCode);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalledWith(anAssertionRef);
    expect(mockDelLollipop).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockDel).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" },
    });
  });

  it(`
  GIVEN a lollipop enabled flow
  WHEN there is no assertionRef on redis
  THEN it should not send the pub key revokal message and succeed deleting the assertionRef and the session tokens
  `, async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockGetLollipop.mockResolvedValueOnce(E.right(O.none));
    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockDel.mockResolvedValueOnce(E.right(true));

    const response = await lollipopActivatedController.logout(req);
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledWith(aFiscalCode);
    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockDel).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" },
    });
  });

  it(`
  GIVEN an enabled lollipop flow
  WHEN the pub key revokal message sending fails
  THEN it should succeed deleting the assertionRef and the session tokens`, async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockRevokePreviousAssertionRef.mockImplementationOnce(() =>
      Promise.reject("error")
    );
    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockDel.mockResolvedValueOnce(E.right(true));

    const response = await lollipopActivatedController.logout(req);
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledWith(aFiscalCode);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalledWith(anAssertionRef);
    expect(mockDelLollipop).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockDel).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" },
    });
  });

  it(`
  GIVEN an enabled lollipop flow
  WHEN the user data is invalid
  THEN it should fail and not call internal functions`, async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = invalidUserPayload;

    const response = await lollipopActivatedController.logout(req);
    response.apply(res);

    expect(mockGetLollipop).not.toHaveBeenCalled();
    expect(mockRevokePreviousAssertionRef).not.toHaveBeenCalled();
    expect(mockDelLollipop).not.toHaveBeenCalled();
    expect(mockDel).not.toBeCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it(`
  GIVEN an enabled lollipop flow
  WHEN it can't retrieve the assertionRef from redis because of an error
  THEN it should fail not sending the pub key revokal message and not deleting the assertionRef and the session tokens`, async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockGetLollipop.mockImplementationOnce(() => Promise.reject("error"));

    const response = await lollipopActivatedController.logout(req);
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledWith(aFiscalCode);
    expect(mockRevokePreviousAssertionRef).not.toBeCalled();
    expect(mockDelLollipop).not.toBeCalled();
    expect(mockDel).not.toBeCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "error",
    });
  });

  it(`
  GIVEN an enabled lollipop flow
  WHEN it can't delete the assertionRef from redis because of an error
  THEN it should fail after sending the pub key revokal message but not deleting the session tokens`, async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockRevokePreviousAssertionRef.mockResolvedValueOnce({});
    mockDelLollipop.mockImplementationOnce(() => Promise.reject("error"));

    const response = await lollipopActivatedController.logout(req);
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledWith(aFiscalCode);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalledWith(anAssertionRef);
    expect(mockDelLollipop).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockDel).not.toBeCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "error",
    });
  });

  it(`
  GIVEN an enabled lollipop flow
  WHEN the session can not be destroyed
  THEN it should fail after sending the pub key revokal message and deleting the assertionRef`, async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockRevokePreviousAssertionRef.mockResolvedValueOnce({});
    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockDel.mockResolvedValueOnce(E.right(false));

    const response = await lollipopActivatedController.logout(req);
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledWith(aFiscalCode);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalledWith(anAssertionRef);
    expect(mockDelLollipop).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockDel).toHaveBeenCalledWith(mockedUser);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error destroying the user session",
    });
  });

  it(`
  GIVEN an enabled lollipop flow
  WHEN the Redis client returns an error
  THEN it should fail after sending the pub key revokal message and deleting the assertionRef`, async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockGetLollipop.mockResolvedValueOnce(E.right(O.some(anAssertionRef)));
    mockRevokePreviousAssertionRef.mockResolvedValueOnce({});
    mockDelLollipop.mockResolvedValueOnce(E.right(true));
    mockDel.mockResolvedValueOnce(E.left(new Error("Redis error")));

    const response = await lollipopActivatedController.logout(req);
    response.apply(res);

    expect(mockGetLollipop).toHaveBeenCalledWith(aFiscalCode);
    expect(mockRevokePreviousAssertionRef).toHaveBeenCalledWith(anAssertionRef);
    expect(mockDelLollipop).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockDel).toHaveBeenCalledWith(mockedUser);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Redis error",
    });
  });
});
