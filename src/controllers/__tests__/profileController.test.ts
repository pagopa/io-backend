/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */

import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { ExtendedProfile } from "../../../generated/backend/ExtendedProfile";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { IsInboxEnabled } from "../../../generated/backend/IsInboxEnabled";
import { IsWebhookEnabled } from "../../../generated/backend/IsWebhookEnabled";
import {
  PreferredLanguage,
  PreferredLanguageEnum
} from "../../../generated/backend/PreferredLanguage";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import ProfileService from "../../services/profileService";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import ProfileController from "../profileController";

const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const anIsInboxEnabled = true as IsInboxEnabled;
const anIsWebookEnabled = true as IsWebhookEnabled;
const aPreferredLanguages: ReadonlyArray<PreferredLanguage> = [
  PreferredLanguageEnum.it_IT
];
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

const proxyUserResponse = {
  created_at: aTimestamp,
  email: anEmailAddress,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  isInboxEnabled: anIsInboxEnabled,
  isWebhookEnabled: anIsWebookEnabled,
  name: "Giuseppe Maria",
  preferredLanguages: aPreferredLanguages,
  spid_email: anEmailAddress,
  token: "123hexToken",
  version: 1 as NonNegativeInteger
};

const apiUserProfileResponse = {
  email: anEmailAddress,
  is_inbox_enabled: true,
  is_webhook_enabled: true,
  preferred_languages: ["it_IT"],
  version: 42
};

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "123hexToken" as WalletToken
};

// mock for upsert user (Extended Profile)
const mockedUpsertProfile: ExtendedProfile = {
  email: anEmailAddress,
  is_email_enabled: true,
  is_inbox_enabled: anIsInboxEnabled,
  is_webhook_enabled: anIsWebookEnabled,
  preferred_languages: aPreferredLanguages,
  version: 1 as NonNegativeInteger
};

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

const mockGetProfile = jest.fn();
const mockGetApiProfile = jest.fn();
const mockUpsertProfile = jest.fn();
jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getApiProfile: mockGetApiProfile,
      getProfile: mockGetProfile,
      upsertProfile: mockUpsertProfile
    }))
  };
});

describe("ProfileController#getProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getProfile on the ProfileService with valid values", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyUserResponse))
    );

    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    const response = await controller.getProfile(req);

    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyUserResponse
    });
  });

  it("calls the getProfile on the ProfileService with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyUserResponse))
    );

    req.user = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    const response = await controller.getProfile(req);
    response.apply(res);

    // getProfile is not called
    expect(mockGetProfile).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("ProfileController#getApiProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getApiProfile on the ProfileService with valid values", async () => {
    const req = mockReq();

    mockGetApiProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(apiUserProfileResponse))
    );

    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);
    const response = await controller.getApiProfile(req);

    expect(mockGetApiProfile).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: apiUserProfileResponse
    });
  });

  it("calls the getApiProfile on the ProfileService with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetApiProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(apiUserProfileResponse))
    );

    req.user = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    const response = await controller.getApiProfile(req);
    response.apply(res);

    // getApiProfile is not called
    expect(mockGetApiProfile).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("ProfileController#upsertProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the upsertProfile on the ProfileService with valid values", async () => {
    const req = mockReq();

    mockUpsertProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyUserResponse))
    );

    req.user = mockedUser;
    req.body = mockedUpsertProfile;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    const response = await controller.upsertProfile(req);

    expect(mockUpsertProfile).toHaveBeenCalledWith(
      mockedUser,
      mockedUpsertProfile
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyUserResponse
    });
  });

  it("calls the upsertProfile on the ProfileService with empty user and valid upsert user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockUpsertProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyUserResponse))
    );

    req.user = "";
    req.body = mockedUpsertProfile;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    const response = await controller.upsertProfile(req);
    response.apply(res);

    expect(mockUpsertProfile).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("calls the upsertProfile on the ProfileService with valid user and empty upsert profile", async () => {
    const req = mockReq();
    const res = mockRes();

    mockUpsertProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyUserResponse))
    );

    req.user = mockedUser;
    req.body = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    const response = await controller.upsertProfile(req);
    response.apply(res);

    expect(mockUpsertProfile).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});
