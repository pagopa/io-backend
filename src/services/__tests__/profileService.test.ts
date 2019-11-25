import * as t from "io-ts";
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
import { ExtendedProfile as ExtendedProfileApi } from "../../../generated/io-api/ExtendedProfile";
import { NewProfile } from "../../../generated/io-api/NewProfile";

import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import ApiClientFactory from "../apiClientFactory";
import ProfileService from "../profileService";

const aValidFiscalCode = "XUZTCT88A51Y311X" as FiscalCode;
const aValidAPIEmail = "from_api@example.com" as EmailAddress;
const aValidSPIDEmail = "from_spid@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
const anIsInboxEnabled = true as IsInboxEnabled;
const anIsWebookEnabled = true as IsWebhookEnabled;
const aPreferredLanguages: ReadonlyArray<PreferredLanguage> = [
  PreferredLanguageEnum.it_IT
];

const validApiProfile: ExtendedProfileApi = {
  email: aValidAPIEmail,
  is_email_enabled: true,
  is_email_validated: true,
  is_inbox_enabled: true,
  is_webhook_enabled: true,
  preferred_languages: aPreferredLanguages,
  version: 42
};

const validApiProfileResponse = {
  status: 200,
  value: validApiProfile
};
const proxyInitializedProfileResponse = {
  blocked_inbox_or_channels: undefined,
  email: aValidAPIEmail,
  family_name: "Lusso",
  fiscal_code: "XUZTCT88A51Y311X",
  has_profile: true,
  is_email_validated: true,
  is_inbox_enabled: true,
  is_webhook_enabled: true,
  name: "Luca",
  preferred_languages: aPreferredLanguages,
  spid_email: aValidSPIDEmail,
  spid_mobile_phone: "3222222222222",
  version: 42
};

const updateProfileRequest: ExtendedProfile = {
  email: aValidAPIEmail,
  is_email_enabled: true,
  is_email_validated: true,
  is_inbox_enabled: anIsInboxEnabled,
  is_webhook_enabled: anIsWebookEnabled,
  preferred_languages: aPreferredLanguages,
  version: 42
};

const createProfileRequest: NewProfile = {
  email: aValidAPIEmail,
  is_email_validated: true
};

const acceptedApiResponse = {
  status: 202
};
const notFoundApiResponse = {
  status: 404
};
const APIError = {
  status: 500
};

const tooManyReqApiMessagesResponse = {
  status: 429
};

// mock for a valid User
const mockedUser: User = {
  created_at: 1183518855,
  family_name: "Lusso",
  fiscal_code: aValidFiscalCode,
  name: "Luca",
  session_token: "HexToKen" as SessionToken,
  spid_email: aValidSPIDEmail,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "HexToKen" as WalletToken
};

const expectedApiError = new Error("Api error.");

const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();
const mockCreateProfile = jest.fn();
const mockEmailValidationProcess = jest.fn();

const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    createProfile: mockCreateProfile,
    emailValidationProcess: mockEmailValidationProcess,
    getProfile: mockGetProfile,
    updateProfile: mockUpdateProfile
  };
});
jest.mock("../../services/apiClientFactory", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getClient: mockGetClient
    }))
  };
});

const api = new ApiClientFactory("", "");

describe("ProfileService#getProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a user profile from the API", async () => {
    mockGetProfile.mockImplementation(() => t.success(validApiProfileResponse));

    const service = new ProfileService(api);

    const res = await service.getProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyInitializedProfileResponse
    });
  });

  it("returns an 429 HTTP error from getProfile upstream API", async () => {
    mockGetProfile.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new ProfileService(api);

    const res = await service.getProfile(mockedUser);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });

  it("forward not found error if the response from the API is not found", async () => {
    mockGetProfile.mockImplementation(() => t.success(notFoundApiResponse));

    const service = new ProfileService(api);

    const res = await service.getProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("returns an error if the API returns an error", async () => {
    mockGetProfile.mockImplementation(() => t.success(APIError));

    const service = new ProfileService(api);

    try {
      await service.getProfile(mockedUser);
    } catch (e) {
      expect(mockGetProfile).toHaveBeenCalledWith({
        fiscalCode: mockedUser.fiscal_code
      });
      expect(e).toEqual(expectedApiError);
    }
  });
});

describe("ProfileService#getApiProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a user profile from the API", async () => {
    mockGetProfile.mockImplementation(() => t.success(validApiProfileResponse));

    const service = new ProfileService(api);

    const res = await service.getApiProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: validApiProfileResponse.value
    });
  });

  it("returns an 429 HTTP error from getApiProfile upstream API", async () => {
    mockGetProfile.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new ProfileService(api);

    const res = await service.getApiProfile(mockedUser);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });

  it("returns 404 response if the profile of the user not exists into the api", async () => {
    mockGetProfile.mockImplementation(() => t.success(notFoundApiResponse));

    const service = new ProfileService(api);

    const res = await service.getApiProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      detail: "Not found: Profile not found.",
      kind: "IResponseErrorNotFound"
    });
  });

  it("returns an error if the API returns an error", async () => {
    mockGetProfile.mockImplementation(() => t.success(APIError));

    const service = new ProfileService(api);

    try {
      await service.getApiProfile(mockedUser);
    } catch (e) {
      expect(mockGetProfile).toHaveBeenCalledWith({
        fiscalCode: mockedUser.fiscal_code
      });
      expect(e).toEqual(expectedApiError);
    }
  });
});

describe("ProfileService#updateProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("update an user profile to the API", async () => {
    mockUpdateProfile.mockImplementation(() =>
      t.success(validApiProfileResponse)
    );

    const service = new ProfileService(api);

    const res = await service.updateProfile(mockedUser, updateProfileRequest);

    expect(mockUpdateProfile).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code,
      profile: updateProfileRequest
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyInitializedProfileResponse
    });
  });

  it("fails to update an user profile to the API", async () => {
    mockUpdateProfile.mockImplementation(() => t.success(notFoundApiResponse));

    const service = new ProfileService(api);

    const res = await service.updateProfile(mockedUser, updateProfileRequest);

    expect(res.kind).toEqual("IResponseErrorNotFound");
  });

  it("returns an 429 HTTP error from updateProfile upstream API", async () => {
    mockUpdateProfile.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new ProfileService(api);

    const res = await service.updateProfile(mockedUser, updateProfileRequest);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });
});

describe("ProfileService#createProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create an user profile to the API", async () => {
    mockCreateProfile.mockImplementation(() =>
      t.success(validApiProfileResponse)
    );

    const service = new ProfileService(api);

    const res = await service.createProfile(mockedUser, createProfileRequest);

    expect(mockCreateProfile).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code,
      newProfile: createProfileRequest
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyInitializedProfileResponse
    });
  });

  it("fails to create an user profile to the API", async () => {
    mockCreateProfile.mockImplementation(() => t.success(APIError));

    const service = new ProfileService(api);

    const res = await service.createProfile(mockedUser, createProfileRequest);

    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns an 429 HTTP error from createProfile upstream API", async () => {
    mockCreateProfile.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new ProfileService(api);

    const res = await service.createProfile(mockedUser, createProfileRequest);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });
});

describe("ProfileService#emailValidationProcess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should returns ResponseSuccessAccepted if no error occours", async () => {
    mockEmailValidationProcess.mockImplementation(() =>
      t.success(acceptedApiResponse)
    );

    const service = new ProfileService(api);

    const res = await service.emailValidationProcess(mockedUser);

    expect(mockEmailValidationProcess).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessAccepted"
    });
  });

  it("returns 404 response if the 404 was provided from the functions API", async () => {
    mockEmailValidationProcess.mockImplementation(() =>
      t.success(notFoundApiResponse)
    );

    const service = new ProfileService(api);

    const res = await service.emailValidationProcess(mockedUser);

    expect(mockEmailValidationProcess).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      detail: "Not found: User not found.",
      kind: "IResponseErrorNotFound"
    });
  });

  it("returns an 429 HTTP error from emailValidationProcess upstream API", async () => {
    mockEmailValidationProcess.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new ProfileService(api);

    const res = await service.emailValidationProcess(mockedUser);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });
});
