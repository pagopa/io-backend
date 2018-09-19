/* tslint:disable:no-any */

import { right } from "fp-ts/lib/Either";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import ProfileService from "../../services/profileService";
import { EmailAddress } from "../../types/api/EmailAddress";
import { ExtendedProfile } from "../../types/api/ExtendedProfile";
import { FiscalCode } from "../../types/api/FiscalCode";
import { IsInboxEnabled } from "../../types/api/IsInboxEnabled";
import { IsWebhookEnabled } from "../../types/api/IsWebhookEnabled";
import {
  PreferredLanguage,
  PreferredLanguageEnum
} from "../../types/api/PreferredLanguage";
import { SpidLevelEnum } from "../../types/api/SpidLevel";
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
  is_inbox_enabled: anIsInboxEnabled,
  is_webhook_enabled: anIsWebookEnabled,
  preferred_languages: aPreferredLanguages,
  version: 1 as NonNegativeInteger
};

const anErrorResponse = {
  detail: undefined,
  status: 500,
  title: "Internal server error",
  type: undefined
};

const mockGetProfile = jest.fn();
const mockUpsertProfile = jest.fn();
jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
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

    mockGetProfile.mockReturnValue(Promise.resolve(right(proxyUserResponse)));

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

    mockGetProfile.mockReturnValue(Promise.resolve(right(proxyUserResponse)));

    req.user = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    const response = await controller.getProfile(req);
    response.apply(res);

    // getProfile is not called
    expect(mockGetProfile).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: expect.stringContaining("Cannot extract the user from request")
    });
  });
});

describe("ProfileController#upsertProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the upsertProfile on the ProfileService with valid values", async () => {
    const req = mockReq();

    mockUpsertProfile.mockReturnValue(
      Promise.resolve(right(proxyUserResponse))
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
      Promise.resolve(right(proxyUserResponse))
    );

    req.user = "";
    req.body = mockedUpsertProfile;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    const response = await controller.upsertProfile(req);
    response.apply(res);

    expect(mockUpsertProfile).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: expect.stringContaining("Cannot extract the user from request")
    });
  });

  it("calls the upsertProfile on the ProfileService with valid user and empty upsert user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockUpsertProfile.mockReturnValue(
      Promise.resolve(right(proxyUserResponse))
    );

    req.user = mockedUser;
    req.body = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    const response = await controller.upsertProfile(req);
    response.apply(res);

    expect(mockUpsertProfile).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Unable to extract the upsert profile",
      status: 400,
      title: "Bad request"
    });
  });
});
