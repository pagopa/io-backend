/* tslint:disable:no-any */
/* tslint:disable:no-duplicate-string */
/* tslint:disable:no-let */
/* tslint:disable:no-identical-functions */
/* tslint:disable:no-big-function */
/* tslint:disable:no-object-mutation */

import { isRight, left, right } from "fp-ts/lib/Either";
import { UrlFromString } from "italia-ts-commons/lib/url";
import * as lolex from "lolex";
import * as redis from "redis";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { NewProfile } from "../../../generated/io-api/NewProfile";

import {
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponsePermanentRedirect,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { UserIdentity } from "../../../generated/auth/UserIdentity";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClientFactory from "../../services/apiClientFactory";
import NotificationService from "../../services/notificationService";
import ProfileService from "../../services/profileService";
import RedisSessionStorage from "../../services/redisSessionStorage";
import TokenService from "../../services/tokenService";
import UsersLoginLogService from "../../services/usersLoginLogService";
import { SessionToken, WalletToken } from "../../types/token";
import { exactUserIdentityDecode, User } from "../../types/user";
import AuthenticationController from "../authenticationController";

// user constant
const aTimestamp = 1518010929530;

const theCurrentTimestampMillis = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidname = "Giuseppe Maria";
const aValidsurname = "Garibaldi";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// authentication constant
const mockSessionToken =
  "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b";
const mockWalletToken =
  "5ba5b99a982da1aa5eb4fd8643124474fa17ee3016c13c617ab79d2e7c8624bb80105c0c0cae9864e035a0d31a715043";
const mockMyPortalToken = "c4d6bc16ef30211fb3fa8855efecac21be04a7d032f8700d";
const mockBPDToken = "4123ee213b64955212ea59e3beeaad1e5fdb3a36d2210416";

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: aValidsurname,
  fiscal_code: aFiscalNumber,
  name: aValidname,
  session_token: mockSessionToken as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  date_of_birth: "2000-06-02",
  wallet_token: mockWalletToken as WalletToken
};

// validUser has all every field correctly set.
const validUserPayload = {
  authnContextClassRef: aValidSpidLevel,
  email: anEmailAddress,
  familyName: aValidsurname,
  fiscalNumber: aFiscalNumber,
  getAssertionXml: () => "",
  issuer: "xxx",
  dateOfBirth: "2000-06-02",
  name: aValidname
};
// invalidUser lacks the required familyName and optional email fields.
const invalidUserPayload = {
  authnContextClassRef: aValidSpidLevel,
  fiscalNumber: aFiscalNumber,
  getAssertionXml: () => "",
  issuer: "xxx",
  dateOfBirth: "2000-06-02",
  name: aValidname
};

const proxyInitializedProfileResponse = {
  blocked_inbox_or_channels: undefined,
  email: anEmailAddress,
  family_name: aValidsurname,
  fiscal_code: aFiscalNumber,
  has_profile: true,
  is_inbox_enabled: true,
  is_webhook_enabled: true,
  name: aValidname,
  preferred_languages: ["it_IT"],
  spid_email: anEmailAddress,
  version: 42
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
  };
};

let controller: AuthenticationController;
beforeAll(async () => {
  const api = new ApiClientFactory("", "");
  const profileService = new ProfileService(api);
  const notificationService = new NotificationService("", "");
  const usersLoginLogService = new UsersLoginLogService("", "");

  controller = new AuthenticationController(
    redisSessionStorage,
    tokenService,
    getClientProfileRedirectionUrl,
    profileService,
    notificationService,
    usersLoginLogService,
    []
  );
});

let clock: any;
beforeEach(() => {
  // We need to mock time to test token expiration.
  clock = lolex.install({ now: theCurrentTimestampMillis });

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

    mockSet.mockReturnValue(Promise.resolve(right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(right(false)));
    mockGetNewToken
      .mockReturnValueOnce(mockSessionToken)
      .mockReturnValueOnce(mockWalletToken);

    mockGetProfile.mockReturnValue(
      ResponseErrorNotFound("Not Found.", "Profile not found")
    );
    mockCreateProfile.mockReturnValue(
      ResponseSuccessJson(proxyInitializedProfileResponse)
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

    mockSet.mockReturnValue(Promise.resolve(right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(right(false)));
    mockGetNewToken
      .mockReturnValueOnce(mockSessionToken)
      .mockReturnValueOnce(mockWalletToken);

    mockGetProfile.mockReturnValue(
      ResponseSuccessJson(proxyInitializedProfileResponse)
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

    mockSet.mockReturnValue(Promise.resolve(right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(right(false)));
    mockGetNewToken
      .mockReturnValueOnce(mockSessionToken)
      .mockReturnValueOnce(mockWalletToken);

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

    mockSet.mockReturnValue(Promise.resolve(right(true)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(right(false)));
    mockGetNewToken
      .mockReturnValueOnce(mockSessionToken)
      .mockReturnValueOnce(mockWalletToken);

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
    mockIsBlockedUser.mockReturnValue(Promise.resolve(right(false)));
    const response = await controller.acs(invalidUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("should fail if the session can not be saved", async () => {
    mockSet.mockReturnValue(Promise.resolve(right(false)));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(right(false)));
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
    mockIsBlockedUser.mockReturnValue(Promise.resolve(right(true)));
    const res = mockRes();

    const response = await controller.acs(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should fail if Redis Client returns an error while getting info on user blocked", async () => {
    mockIsBlockedUser.mockReturnValue(
      Promise.resolve(left(new Error("Redis error")))
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
    mockSet.mockReturnValue(Promise.resolve(left(new Error("Redis error"))));
    mockIsBlockedUser.mockReturnValue(Promise.resolve(right(false)));
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
});

describe("AuthenticationController#acsTest", () => {
  let acsSpyOn: jest.SpyInstance<
    ReturnType<AuthenticationController["acs"]>,
    ArgsType<AuthenticationController["acs"]>
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
      });
    });
    const response = await controller.acsTest(validUserPayload);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(response.kind).toEqual("IResponseErrorInternal");
  });
});

describe("AuthenticationController#getUserIdentity", () => {
  let mockUserDecode: jest.Mock | undefined;
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
    /* tslint:disable-next-line:no-useless-cast */
    const expectedValue = exactUserIdentityDecode(mockedUser as UserIdentity);
    expect(isRight(expectedValue)).toBeTruthy();
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: expectedValue.value
    });
  });

  it("should fail if the User object doesn't match UserIdentity decoder contraints", async () => {
    const res = mockRes();
    const req = mockReq();
    req.user = invalidUserPayload;

    // Emulate a successfully User decode and a failure on UserIdentity decode
    const user = require("../../types/user").User;
    mockUserDecode = jest
      .spyOn(user, "decode")
      .mockImplementation((_: unknown) => right(_));

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

    mockDel.mockReturnValue(Promise.resolve(right(true)));

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
      myportal_token: mockMyPortalToken
    };
    req.user = userWithExternalToken;

    mockDel.mockReturnValue(Promise.resolve(right(true)));

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
    mockDel.mockReturnValue(Promise.resolve(right(false)));

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
    mockDel.mockReturnValue(Promise.resolve(left(new Error("Redis error"))));

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
