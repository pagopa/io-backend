import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { User } from "../../types/user";
import ApiClientFactory from "../apiClientFactory";
import ProfileService from "../profileService";

const validFiscalCode = "XUZTCT88A51Y311X";
const validApiProfileResponse = {
  email: "from_api@example.com",
  isInboxEnabled: true,
  preferredLanguages: "it_IT",
  version: 42
};
const proxyProfileWithEmailResponse = {
  email: "from_api@example.com",
  family_name: "Lusso",
  fiscal_code: "XUZTCT88A51Y311X",
  has_profile: true,
  is_email_set: true,
  is_inbox_enabled: true,
  name: "Luca",
  preferred_email: "from_spid@example.com",
  preferred_languages: "it_IT",
  version: 42
};
const proxyProfileWithoutEmailResponse = {
  family_name: "Lusso",
  fiscal_code: validFiscalCode,
  has_profile: false,
  is_email_set: false,
  is_inbox_enabled: false,
  name: "Luca",
  preferred_email: "from_spid@example.com",
  version: 0
};
const proxyUpsertRequest = {
  email: "from_api@example.com" as EmailAddress,
  is_inbox_enabled: true,
  preferred_languages: "it_IT",
  version: 42
};
const ApiProfileUpsertRequest = {
  body: {
    email: "from_api@example.com",
    is_inbox_enabled: true,
    preferred_languages: "it_IT",
    version: 42
  }
};
const emptyApiProfileResponse = {
  status: 404
};
const problemJson = {
  detail: "Error.",
  status: 500
};

// mock for a valid User
const mockedUser: User = {
  created_at: 1183518855,
  family_name: "Lusso",
  fiscal_code: validFiscalCode as FiscalCode,
  name: "Luca",
  nameID: "lussoluca",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: "from_spid@example.com" as EmailAddress,
  sessionIndex: "sessionIndex",
  spid_idp: "spid_idp_name",
  token: "HexToKen"
};

const mockGetProfile = jest.fn();
const mockUpsertProfile = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    getProfile: mockGetProfile,
    upsertProfile: mockUpsertProfile
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

    expect(mockGetClient).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockGetProfile).toHaveBeenCalledWith();
    expect(res).toEqual(proxyProfileWithEmailResponse);
  });

  it("returns a default user profile if the response from the API is not found", async () => {
    mockGetProfile.mockImplementation(() => {
      return emptyApiProfileResponse;
    });

    const service = new ProfileService(api);

    const res = await service.getProfile(mockedUser);

    expect(mockGetClient).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockGetProfile).toHaveBeenCalledWith();
    expect(res).toEqual(proxyProfileWithoutEmailResponse);
  });

  it("returns an error if the API returns an error", async () => {
    mockGetProfile.mockImplementation(() => {
      return problemJson;
    });

    const service = new ProfileService(api);

    try {
      await service.getProfile(mockedUser);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(mockedUser.fiscal_code);
      expect(mockGetProfile).toHaveBeenCalledWith();
      expect(e).toEqual(new Error("Api error."));
    }
  });
});

describe("ProfileService#upsertProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create a new user profile to the API", async () => {
    mockUpsertProfile.mockImplementation(() => {
      return validApiProfileResponse;
    });

    const service = new ProfileService(api);

    const res = await service.upsertProfile(mockedUser, proxyUpsertRequest);

    expect(mockGetClient).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockUpsertProfile).toHaveBeenCalledWith(ApiProfileUpsertRequest);
    expect(res).toEqual(proxyProfileWithEmailResponse);
  });

  it("fails to create a new user profile to the API", async () => {
    mockUpsertProfile.mockImplementation(() => {
      return emptyApiProfileResponse;
    });

    const service = new ProfileService(api);

    try {
      await service.upsertProfile(mockedUser, proxyUpsertRequest);
    } catch (e) {
      expect(mockGetClient).toBeCalledWith("XUZTCT88A51Y311X");
      expect(e).toEqual(new Error("Api error."));
    }
  });
});
