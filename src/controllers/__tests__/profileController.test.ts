// tslint:disable:no-any

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import ProfileService from "../../services/profileService";
import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { IsInboxEnabled } from "../../types/api/IsInboxEnabled";
import { PreferredLanguage } from "../../types/api/PreferredLanguages";
import { ExtendedProfile } from "../../types/api_client/extendedProfile";
import { User } from "../../types/user";
import ProfileController from "../profileController";

const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const anIsInboxEnabled = true as IsInboxEnabled;
const aPreferredLanguage = "it_IT" as PreferredLanguage;

const proxyUserResponse = {
  created_at: aTimestamp,
  email: anEmailAddress,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  isInboxEnabled: anIsInboxEnabled,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferredLanguages: aPreferredLanguage,
  preferred_email: anEmailAddress,
  sessionIndex: "123sessionIndex",
  spid_idp: "spid_idp_name",
  token: "123hexToken",
  version: 1 as number
};

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: anEmailAddress,
  sessionIndex: "123sessionIndex",
  spid_idp: "spid_idp_name",
  token: "123hexToken"
};

// mock for upsert user (Extended Profile)
const mockedUpsertUser: ExtendedProfile = {
  email: anEmailAddress,
  isInboxEnabled: anIsInboxEnabled,
  preferredLanguages: aPreferredLanguage,
  version: 1 as number
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

function flushPromises<T>(): Promise<T> {
  return new Promise(resolve => setImmediate(resolve));
}

describe("ProfileController#getProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getProfile on the ProfileService with valid values", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetProfile.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(proxyUserResponse));
      });
    });

    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    controller.getProfile(req, res);

    await flushPromises();

    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(res.json).toHaveBeenCalledWith(proxyUserResponse);
  });

  it("calls the getProfile on the ProfileService with empty user", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetProfile.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(proxyUserResponse));
      });
    });

    req.user = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    controller.getProfile(req, res);

    await flushPromises();

    // getProfile is not called
    expect(mockGetProfile).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Unable to decode the user"
    });
  });

  it("calls the getProfile on the ProfileService with valid user but user is not in proxy", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetProfile.mockImplementation(() => {
      return Promise.reject("reject");
    });

    res.status = jest.fn().mockImplementation(() => ({
      json: jest.fn()
    }));
    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    controller.getProfile(req, res);

    await flushPromises();

    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("ProfileController#upsertProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the upsertProfile on the ProfileService with valid values", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockUpsertProfile.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(proxyUserResponse));
      });
    });

    req.user = mockedUser;
    req.body = mockedUpsertUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    controller.upsertProfile(req, res);

    await flushPromises();

    expect(mockUpsertProfile).toHaveBeenCalledWith(
      mockedUser,
      mockedUpsertUser
    );
    expect(res.json).toHaveBeenCalledWith(proxyUserResponse);
  });

  it("calls the upsertProfile on the ProfileService with empty user and valid upsert user", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockUpsertProfile.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(proxyUserResponse));
      });
    });

    req.user = "";
    req.body = mockedUpsertUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    controller.upsertProfile(req, res);

    await flushPromises();

    expect(mockUpsertProfile).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Unable to decode the user"
    });
  });

  it("calls the upsertProfile on the ProfileService with valid user and empty upsert user", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockUpsertProfile.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(proxyUserResponse));
      });
    });

    req.user = mockedUser;
    req.body = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    controller.upsertProfile(req, res);

    await flushPromises();

    expect(mockUpsertProfile).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Unable to extract the upsert profile"
    });
  });

  it("calls the upsertProfile on the ProfileService with valid values but user is not in proxy", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockUpsertProfile.mockImplementation(() => {
      return Promise.reject("reject");
    });

    req.user = mockedUser;
    req.body = mockedUpsertUser;

    res.status = jest.fn().mockImplementation(() => ({
      json: jest.fn()
    }));

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const controller = new ProfileController(profileService);

    controller.upsertProfile(req, res);

    await flushPromises();

    expect(mockUpsertProfile).toHaveBeenCalledWith(
      mockedUser,
      mockedUpsertUser
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
