import * as t from "io-ts";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { IsInboxEnabled } from "../../../generated/backend/IsInboxEnabled";
import { IsWebhookEnabled } from "../../../generated/backend/IsWebhookEnabled";
import {
  PreferredLanguage,
  PreferredLanguageEnum
} from "../../../generated/backend/PreferredLanguage";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";

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

const validApiProfileResponse = {
  status: 200,
  value: {
    email: aValidAPIEmail,
    is_inbox_enabled: true,
    is_webhook_enabled: true,
    preferred_languages: ["it_IT"],
    version: 42
  }
};
const proxyInitializedProfileResponse = {
  blocked_inbox_or_channels: undefined,
  email: aValidAPIEmail,
  family_name: "Lusso",
  fiscal_code: "XUZTCT88A51Y311X",
  has_profile: true,
  is_inbox_enabled: true,
  is_webhook_enabled: true,
  name: "Luca",
  preferred_languages: ["it_IT"],
  spid_email: aValidSPIDEmail,
  spid_mobile_phone: "3222222222222",
  version: 42
};
const proxyAuthenticatedProfileResponse = {
  family_name: "Lusso",
  fiscal_code: aValidFiscalCode,
  has_profile: false,
  name: "Luca",
  spid_email: aValidSPIDEmail,
  spid_mobile_phone: "3222222222222"
};
const upsertRequest = {
  email: aValidAPIEmail,
  is_email_enabled: true,
  is_inbox_enabled: anIsInboxEnabled,
  is_webhook_enabled: anIsWebookEnabled,
  preferred_languages: aPreferredLanguages,
  version: 42
};
const emptyApiProfileResponse = {
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
const mockCreateOrUpdateProfile = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    getProfile: mockGetProfile,
    upsertProfile: mockCreateOrUpdateProfile
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

  it("returns a default user profile if the response from the API is not found", async () => {
    mockGetProfile.mockImplementation(() => t.success(emptyApiProfileResponse));

    const service = new ProfileService(api);

    const res = await service.getProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyAuthenticatedProfileResponse
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
    mockGetProfile.mockImplementation(() => t.success(emptyApiProfileResponse));

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

describe("ProfileService#upsertProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create a new user profile to the API", async () => {
    mockCreateOrUpdateProfile.mockImplementation(() =>
      t.success(validApiProfileResponse)
    );

    const service = new ProfileService(api);

    const res = await service.upsertProfile(mockedUser, upsertRequest);

    expect(mockCreateOrUpdateProfile).toHaveBeenCalledWith({
      extendedProfile: upsertRequest,
      fiscalCode: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyInitializedProfileResponse
    });
  });

  it("fails to create a new user profile to the API", async () => {
    mockCreateOrUpdateProfile.mockImplementation(() =>
      t.success(emptyApiProfileResponse)
    );

    const service = new ProfileService(api);

    try {
      await service.upsertProfile(mockedUser, upsertRequest);
    } catch (e) {
      expect(e).toEqual(new Error("Api error."));
    }
  });

  it("returns an 429 HTTP error from upsertProfile upstream API", async () => {
    mockCreateOrUpdateProfile.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new ProfileService(api);

    const res = await service.upsertProfile(mockedUser, upsertRequest);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });
});
