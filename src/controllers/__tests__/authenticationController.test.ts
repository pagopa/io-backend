import * as E from "fp-ts/lib/Either";
import { UrlFromString, ValidUrl } from "@pagopa/ts-commons/lib/url";
import * as lolex from "lolex";
import * as redis from "redis";
import { NewProfile } from "@pagopa/io-functions-app-sdk/NewProfile";
import {
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponsePermanentRedirect,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
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
  mockedInitializedProfile
} from "../../__mocks__/user_mock";
import ApiClientFactory from "../../services/apiClientFactory";
import NotificationService from "../../services/notificationService";
import ProfileService from "../../services/profileService";
import RedisSessionStorage from "../../services/redisSessionStorage";
import TokenService from "../../services/tokenService";
import UsersLoginLogService from "../../services/usersLoginLogService";
import { exactUserIdentityDecode, SpidUser } from "../../types/user";
import AuthenticationController, {
  AGE_LIMIT,
  AGE_LIMIT_ERROR_CODE
} from "../authenticationController";
import { addDays, addMonths, format, subYears } from "date-fns";
import { getClientErrorRedirectionUrl } from "../../config";
import * as appInsights from "applicationinsights";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

// validUser has all every field correctly set.
const validUserPayload = {
  authnContextClassRef: aValidSpidLevel,
  email: aSpidEmailAddress,
  familyName: aValidFamilyname,
  fiscalNumber: aFiscalCode,
  getAssertionXml: () => "",
  issuer: "xxx",
  dateOfBirth: aValidDateofBirth,
  name: aValidName
};
// invalidUser lacks the required familyName and optional email fields.
const invalidUserPayload = {
  authnContextClassRef: aValidSpidLevel,
  fiscalNumber: aFiscalCode,
  getAssertionXml: () => "",
  issuer: "xxx",
  dateOfBirth: aValidDateofBirth,
  name: aValidName
};

const anErrorResponse = {
  detail: undefined,
  status: 500,
  title: "Internal server error",
  type: undefined
};

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

const mockSet = jest.fn();
const mockGetBySessionToken = jest.fn();
const mockGetByWalletToken = jest.fn();
const mockDel = jest.fn();
const mockIsBlockedUser = jest.fn();
jest.mock("../../services/redisSessionStorage", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      del: mockDel,
      getBySessionToken: mockGetBySessionToken,
      getByWalletToken: mockGetByWalletToken,
      isBlockedUser: mockIsBlockedUser,
      set: mockSet
    }))
  };
});

const mockGetNewToken = jest.fn();
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getNewToken: mockGetNewToken,
      getNewTokenAsync: () => Promise.resolve(mockGetNewToken())
    }))
  };
});

const mockGetProfile = jest.fn();
const mockCreateProfile = jest.fn();

jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createProfile: mockCreateProfile,
      getProfile: mockGetProfile
    }))
  };
});

jest.mock("../../services/notificationService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      deleteInstallation: () =>
        Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    }))
  };
});

jest.mock("../../services/usersLoginLogService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      notifyUserLogin: () => Promise.resolve()
    }))
  };
});

const mockTelemetryClient = ({
  trackEvent: jest.fn()
} as unknown) as appInsights.TelemetryClient;

const redisClient = {} as redis.RedisClient;

const tokenService = new TokenService();

const tokenDurationSecs = 0;
const redisSessionStorage = new RedisSessionStorage(
  redisClient,
  tokenDurationSecs
);

const getClientProfileRedirectionUrl = (token: string): UrlFromString => {
  const url = "/profile.html?token={token}".replace("{token}", token);
  return {
    href: url
  } as UrlFromString;
};

let controller: AuthenticationController;
beforeAll(async () => {
  const api = new ApiClientFactory("", "");
  const profileService = new ProfileService(api);
  const notificationService = new NotificationService("", "");
  const notificationServiceFactory = (_fiscalCode: FiscalCode) =>
    notificationService;
  const usersLoginLogService = new UsersLoginLogService("", "");

  controller = new AuthenticationController(
    redisSessionStorage,
    tokenService,
    getClientProfileRedirectionUrl,
    getClientErrorRedirectionUrl,
    profileService,
    notificationServiceFactory,
    usersLoginLogService,
    [],
    true,
    mockTelemetryClient
  );
});

let clock: any;
beforeEach(() => {
  // We need to mock time to test token expiration.
  clock = lolex.install({ now: aTimestamp });

  jest.clearAllMocks();
});
afterEach(() => {
  clock = clock.uninstall();
});

describe("AuthenticationController#acs", () => {
  it("redirects to the correct url if userPayload is a valid User and a profile not exists", async () => {
    const res = mockRes();
    const expectedNewProfile: NewProfile = {
      email: validUserPayload.email,
      is_email_validated: true,
      is_test_profile: false
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
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      "/profile.html?token=" + mockSessionToken
    );
    expect(mockSet).toHaveBeenCalledWith(mockedUser);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).toHaveBeenCalledWith(
      mockedUser,
      expectedNewProfile
    );
  });

  it("redirects to the correct url if userPayload is a valid User and a profile exists", async () => {
    const res = mockRes();

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
      ResponseSuccessJson(mockedInitializedProfile)
    );
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      "/profile.html?token=" + mockSessionToken
    );
    expect(mockSet).toHaveBeenCalledWith(mockedUser);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).not.toBeCalled();
  });

  it("should fail if a profile cannot be created", async () => {
    const res = mockRes();
    const expectedNewProfile: NewProfile = {
      email: validUserPayload.email,
      is_email_validated: true,
      is_test_profile: false
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
      ResponseErrorInternal("Error creating new user profile")
    );
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockSet).toHaveBeenCalledWith(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).toHaveBeenCalledWith(
      mockedUser,
      expectedNewProfile
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "IResponseErrorInternal"
    });
  });

  it("should fail if an error occours checking the profile", async () => {
    const res = mockRes();

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
      ResponseErrorInternal("Error reading the user profile")
    );
    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockSet).toHaveBeenCalledWith(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockCreateProfile).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "IResponseErrorInternal"
    });
  });

  it("should fail if userPayload is invalid", async () => {
    const res = mockRes();
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    const response = await controller.acs(invalidUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
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

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error creating the user session"
    });
  });

  it("should return Unathorized if user is blocked", async () => {
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(true)));
    const res = mockRes();

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should fail if Redis Client returns an error while getting info on user blocked", async () => {
    mockIsBlockedUser.mockReturnValue(
      Promise.resolve(E.left(new Error("Redis error")))
    );
    const res = mockRes();

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error while validating user"
    });
  });

  it("should fail if Redis client returns an error", async () => {
    mockSet.mockReturnValue(Promise.resolve(E.left(new Error("Redis error"))));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(E.right(false)));
    const res = mockRes();

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error while creating the user session"
    });
  });

  it(`should return unauthorized if the user is younger than ${AGE_LIMIT} yo`, async () => {
    const res = mockRes();

    const aYoungUserPayload: SpidUser = {
      ...validUserPayload,
      dateOfBirth: format(
        addDays(subYears(new Date(), AGE_LIMIT), 1),
        "YYYY-MM-DD"
      )
    };
    const response = await controller.acs(aYoungUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockTelemetryClient.trackEvent).toBeCalledWith(
      expect.objectContaining({
        name: "spid.error.generic",
        properties: {
          message: expect.any(String),
          type: "INFO"
        }
      })
    );
    expect(mockSet).not.toBeCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      `/error.html?errorCode=${AGE_LIMIT_ERROR_CODE}`
    );
  });

  it(`should return unauthorized if the user is younger than ${AGE_LIMIT} yo with CIE date format`, async () => {
    const res = mockRes();

    const limitDate = subYears(new Date(), AGE_LIMIT);
    const dateOfBirth =
      limitDate.getDate() > 8 ? addDays(limitDate, 1) : addMonths(limitDate, 1);

    const aYoungUserPayload: SpidUser = {
      ...validUserPayload,
      dateOfBirth: format(dateOfBirth, "YYYY-MM-D")
    };
    const response = await controller.acs(aYoungUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockTelemetryClient.trackEvent).toBeCalledWith(
      expect.objectContaining({
        name: "spid.error.generic",
        properties: {
          message: expect.any(String),
          type: "INFO"
        }
      })
    );
    expect(mockSet).not.toBeCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      `/error.html?errorCode=${AGE_LIMIT_ERROR_CODE}`
    );
  });

  it(`should redirects to the correct url if the user has ${AGE_LIMIT} yo`, async () => {
    const res = mockRes();
    const expectedNewProfile: NewProfile = {
      email: validUserPayload.email,
      is_email_validated: true,
      is_test_profile: false
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
    const aYoungUserPayload: SpidUser = {
      ...validUserPayload,
      dateOfBirth: format(subYears(new Date(), AGE_LIMIT), "YYYY-MM-DD")
    };
    const response = await controller.acs(aYoungUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockTelemetryClient.trackEvent).not.toBeCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      "/profile.html?token=" + mockSessionToken
    );
    expect(mockSet).toHaveBeenCalledWith({
      ...mockedUser,
      date_of_birth: aYoungUserPayload.dateOfBirth
    });
    expect(mockGetProfile).toHaveBeenCalledWith({
      ...mockedUser,
      date_of_birth: aYoungUserPayload.dateOfBirth
    });
    expect(mockCreateProfile).toHaveBeenCalledWith(
      {
        ...mockedUser,
        date_of_birth: aYoungUserPayload.dateOfBirth
      },
      expectedNewProfile
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

    expect(controller).toBeTruthy();
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

    expect(controller).toBeTruthy();
    expect(response).toEqual(expectedResponse);
  });
  it("should return ResponseErrorInternal if the token is missing", async () => {
    acsSpyOn.mockImplementation(async (_: unknown) => {
      return ResponsePermanentRedirect({
        href: "http://invalid-url"
      } as ValidUrl);
    });
    const response = await controller.acsTest(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
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

    expect(controller).toBeTruthy();

    const expectedValue = exactUserIdentityDecode(
      (mockedUser as unknown) as UserIdentity
    );
    expect(E.isRight(expectedValue)).toBeTruthy();
    if (E.isRight(expectedValue)) {
      expect(response).toEqual({
        apply: expect.any(Function),
        kind: "IResponseSuccessJson",
        value: expectedValue.right
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

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: "Internal server error: Unexpected User Identity data format.",
      kind: "IResponseErrorInternal"
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

    expect(controller).toBeTruthy();
    expect(res.redirect).toHaveBeenCalledWith(301, "/");
  });
});

describe("AuthenticationController#logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("shoud return success after deleting session token and wallet token", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;

    mockDel.mockReturnValue(Promise.resolve(E.right(true)));

    const response = await controller.logout(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockDel).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
  });
  it("shoud return success after deleting all auth tokens", async () => {
    const res = mockRes();
    const req = mockReq();
    const userWithExternalToken = {
      ...mockedUser,
      bpd_token: mockBPDToken,
      myportal_token: mockMyPortalToken,
      zendesk_token: mockZendeskToken
    };
    req.user = userWithExternalToken;

    mockDel.mockReturnValue(Promise.resolve(E.right(true)));

    const response = await controller.logout(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockDel).toHaveBeenCalledWith(userWithExternalToken);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
  });

  it("should fail if the generation user data is invalid", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = invalidUserPayload;

    const response = await controller.logout(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockDel).not.toBeCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should fail if the session can not be destroyed", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;
    mockDel.mockReturnValue(Promise.resolve(E.right(false)));

    const response = await controller.logout(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Error destroying the user session"
    });
  });

  it("should fail if Redis client returns an error", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = mockedUser;
    mockDel.mockReturnValue(Promise.resolve(E.left(new Error("Redis error"))));

    const response = await controller.logout(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Redis error"
    });
  });
});
