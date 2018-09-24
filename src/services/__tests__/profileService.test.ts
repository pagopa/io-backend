import { right } from "fp-ts/lib/Either";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { EmailAddress } from "../../types/api/EmailAddress";
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
const proxyProfileResponse = {
  extended: {
    blocked_inbox_or_channels: undefined,
    email: aValidAPIEmail,
    is_inbox_enabled: true,
    is_webhook_enabled: true,
    preferred_languages: ["it_IT"],
    version: 42
  },
  spid: {
    family_name: "Lusso",
    fiscal_code: "XUZTCT88A51Y311X",
    has_profile: true,
    name: "Luca",
    spid_email: aValidSPIDEmail,
    spid_mobile_phone: "3222222222222"
  }
};
const proxyAuthenticatedProfileResponse = {
  spid: {
    family_name: "Lusso",
    fiscal_code: aValidFiscalCode,
    has_profile: false,
    name: "Luca",
    spid_email: aValidSPIDEmail,
    spid_mobile_phone: "3222222222222"
  }
};
const upsertRequest = {
  email: aValidAPIEmail,
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

const mockGetProfile = jest.fn();
const mockCreateOrUpdateProfile = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    createOrUpdateProfile: mockCreateOrUpdateProfile,
    getProfile: mockGetProfile
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
    mockGetProfile.mockImplementation(() => {
      return validApiProfileResponse;
    });

    const service = new ProfileService(api);

    const res = await service.getProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
    });
    expect(res).toEqual(right(proxyProfileResponse));
  });

  it("returns a default user profile if the response from the API is not found", async () => {
    mockGetProfile.mockImplementation(() => {
      return emptyApiProfileResponse;
    });

    const service = new ProfileService(api);

    const res = await service.getProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
    });
    expect(res).toEqual(right(proxyAuthenticatedProfileResponse));
  });

  it("returns an error if the API returns an error", async () => {
    mockGetProfile.mockImplementation(() => {
      return APIError;
    });

    const service = new ProfileService(api);

    try {
      await service.getProfile(mockedUser);
    } catch (e) {
      expect(mockGetProfile).toHaveBeenCalledWith({
        fiscalCode: mockedUser.fiscal_code
      });
      expect(e).toEqual(new Error("Api error."));
    }
  });
});

describe("ProfileService#upsertProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create a new user profile to the API", async () => {
    mockCreateOrUpdateProfile.mockImplementation(() => {
      return validApiProfileResponse;
    });

    const service = new ProfileService(api);

    const res = await service.upsertProfile(mockedUser, upsertRequest);

    expect(mockCreateOrUpdateProfile).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code,
      newProfile: upsertRequest
    });
    expect(res).toEqual(right(proxyProfileResponse));
  });

  it("fails to create a new user profile to the API", async () => {
    mockCreateOrUpdateProfile.mockImplementation(() => {
      return emptyApiProfileResponse;
    });

    const service = new ProfileService(api);

    try {
      await service.upsertProfile(mockedUser, upsertRequest);
    } catch (e) {
      expect(e).toEqual(new Error("Api error."));
    }
  });
});
