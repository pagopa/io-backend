"use strict";

import mockRes from "../../__mocks__/response";
import ProfileService from "../profileService";
import ApiClientFactory from "../apiClientFactory";

const validUser = {
  created_at: "",
  token: "123",
  sessionIndex: "123",
  spid_idp: "xxx",
  fiscal_code: "XUZTCT88A51Y311X",
  name: "Luca",
  family_name: "Lusso",
  preferred_email: "from_spid@example.com",
  nameID: "lussoluca",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient"
};
const validApiProfileResponse = {
  preferredLanguages: ["it_IT"],
  email: "from_api@example.com",
  isInboxEnabled: true,
  version: 42
};
const emptyApiProfileResponse = {
  status: 404
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
  preferred_languages: ["it_IT"],
  version: 42
};
const proxyProfileWithoutEmailResponse = {
  family_name: "Lusso",
  fiscal_code: "XUZTCT88A51Y311X",
  has_profile: false,
  is_email_set: false,
  is_inbox_enabled: false,
  name: "Luca",
  preferred_email: "from_spid@example.com",
  version: 0
};
const proxyUpsertRequest = {
  version: 42,
  email: "from_api@example.com",
  is_inbox_enabled: true,
  preferred_languages: ["it_IT"]
};
const ApiProfileUpsertRequest = {
  body: {
    version: 42,
    email: "from_api@example.com",
    isInboxEnabled: true,
    preferred_languages: ["it_IT"]
  }
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
  return jest.fn().mockImplementation(() => {
    return { getClient: mockGetClient };
  });
});

/**
 * Wait for all promises to finish.
 *
 * @returns {Promise<any>}
 */
function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

describe("ProfileService#getProfile", () => {
  beforeEach(() => {
    ApiClientFactory.mockClear();
    mockGetClient.mockClear();
    mockGetProfile.mockClear();
  });

  it("returns a user profile from the API", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getProfile.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(validApiProfileResponse));
      });
    });

    const service = new ProfileService(api);

    service.getProfile(validUser, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validUser.fiscal_code);
    expect(mockGetProfile).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith(proxyProfileWithEmailResponse);
  });

  it("returns a default user profile if the response from the API is not found", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getProfile.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(emptyApiProfileResponse));
      });
    });

    const service = new ProfileService(api);

    service.getProfile(validUser, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validUser.fiscal_code);
    expect(mockGetProfile).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith(proxyProfileWithoutEmailResponse);
  });

  it("returns an error if the API returns an error", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getProfile.mockImplementation(() => {
      return new Promise((resolve, reject) => {
        process.nextTick(() =>
          reject({
            message: "Error.",
            statusCode: 500
          })
        );
      });
    });

    const service = new ProfileService(api);

    service.getProfile(validUser, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validUser.fiscal_code);
    expect(mockGetProfile).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith({ message: "Error." });
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("ProfileService#upsertProfile", () => {
  beforeEach(() => {
    ApiClientFactory.mockClear();
    mockGetClient.mockClear();
    mockUpsertProfile.mockClear();
  });

  it("create a new user profile to the API", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().upsertProfile.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(validApiProfileResponse));
      });
    });

    const service = new ProfileService(api);

    service.upsertProfile(validUser, proxyUpsertRequest, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validUser.fiscal_code);
    expect(mockUpsertProfile).toHaveBeenCalledWith(ApiProfileUpsertRequest);
    expect(res.json).toHaveBeenCalledWith(proxyProfileWithEmailResponse);
  });
});
