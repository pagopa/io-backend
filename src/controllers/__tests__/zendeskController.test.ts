import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import mockReq from "../../__mocks__/request";
import TokenService from "../../services/tokenService";
import ApiClient from "../../services/apiClientFactory";
import ProfileService from "../../services/profileService";
import { User } from "../../types/user";
import ZendeskController from "../zendeskController";
import {
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorTooManyRequests,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import {
  mockedInitializedProfile,
  mockSessionToken,
  mockWalletToken
} from "../../__mocks__/user_mock";
import * as TE from "fp-ts/TaskEither";

const aTimestamp = 1518010929530;
const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidName = "Giuseppe Maria";
const aValidFamilyname = "Garibaldi";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for a valid request User
const mockedRequestUser: User = {
  created_at: aTimestamp,
  date_of_birth: "2002-01-01",
  family_name: aValidFamilyname,
  fiscal_code: aFiscalNumber,
  name: aValidName,
  session_token: mockSessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  wallet_token: mockWalletToken
};

const mockGetProfile = jest.fn();
jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getProfile: mockGetProfile
    }))
  };
});

const mockGetZendeskSupportToken = jest.fn();

jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getJwtZendeskSupportToken: mockGetZendeskSupportToken
    }))
  };
});

const aZendeskSupportToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiTWFyaW8gUm9zc2kiLCJlbWFpbCI6Im1hcmlvLnJvc3NpQHRlc3QuaXQiLCJleHRlcm5hbF9pZCI6IkFBQUFBQUFBQUFBQUFBQSIsImlhdCI6MTYzNTk0NDg2MC43ODksImp0aSI6IjAxRktKWUszM04wRkpKNEVZRTM5NURIWlhDIiwiZXhwIjoxNjM1OTQ0OTIwLCJpc3MiOiJJU1NVRVIifQ.dqQlnKGME5FvpI2GbkVpk7vpgE_ft0IZE3jp2YRWHtA";

describe("ZendeskController#getZendeskSupportToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a valid Zendesk support token when user has a validated email", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockedInitializedProfile))
    );

    mockGetZendeskSupportToken.mockReturnValue(TE.of(aZendeskSupportToken));

    req.user = mockedRequestUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const tokenService = new TokenService();
    const controller = new ZendeskController(profileService, tokenService);

    const response = await controller.getZendeskSupportToken(req);

    expect(response.kind).toEqual("IResponseSuccessJson");
    if (response.kind === "IResponseSuccessJson") {
      expect(response.value.jwt).toEqual(aZendeskSupportToken);
    }
  });

  it("should return an IResponseErrorInternal if user does not have any email address", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(
        ResponseSuccessJson({
          ...mockedInitializedProfile,
          email: undefined,
          is_email_validated: false,
          spid_email: undefined
        })
      )
    );

    req.user = mockedRequestUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const tokenService = new TokenService();
    const controller = new ZendeskController(profileService, tokenService);

    const response = await controller.getZendeskSupportToken(req);

    expect(response.kind).toEqual("IResponseErrorInternal");
    if (response.kind === "IResponseErrorInternal") {
      expect(response.detail).toEqual(
        "Internal server error: Error retrieving a user profile with validated email address | Profile has not a validated email address"
      );
    }
  });

  it("should return an IResponseErrorInternal if Profile has not a validated email address", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(
        ResponseSuccessJson({
          ...mockedInitializedProfile,
          is_email_validated: false
        })
      )
    );

    req.user = mockedRequestUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const tokenService = new TokenService();
    const controller = new ZendeskController(profileService, tokenService);

    const response = await controller.getZendeskSupportToken(req);

    expect(response.kind).toEqual("IResponseErrorInternal");
    if (response.kind === "IResponseErrorInternal") {
      expect(response.detail).toEqual(
        "Internal server error: Error retrieving a user profile with validated email address | Profile has not a validated email address"
      );
    }
  });

  it("should return an IResponseErrorInternal if user has only the spid email", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(
        ResponseSuccessJson({
          ...mockedInitializedProfile,
          email: undefined,
          is_email_validated: false
        })
      )
    );

    req.user = mockedRequestUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const tokenService = new TokenService();
    const controller = new ZendeskController(profileService, tokenService);

    const response = await controller.getZendeskSupportToken(req);

    expect(response.kind).toEqual("IResponseErrorInternal");
    if (response.kind === "IResponseErrorInternal") {
      expect(response.detail).toEqual(
        "Internal server error: Error retrieving a user profile with validated email address | Profile has not a validated email address"
      );
    }
  });

  it("should return a IResponseErrorInternal if getJwtZendeskSupportToken returns an Error", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockedInitializedProfile))
    );

    mockGetZendeskSupportToken.mockReturnValue(
      TE.left(new Error("ERROR while generating JWT support token"))
    );

    req.user = mockedRequestUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const tokenService = new TokenService();
    const controller = new ZendeskController(profileService, tokenService);

    const response = await controller.getZendeskSupportToken(req);

    expect(response.kind).toEqual("IResponseErrorInternal");
    if (response.kind === "IResponseErrorInternal") {
      expect(response.detail).toEqual(
        "Internal server error: ERROR while generating JWT support token"
      );
    }
  });

  it("should return a IResponseErrorInternal if getProfile promise gets rejected", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(Promise.reject());

    req.user = mockedRequestUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const tokenService = new TokenService();
    const controller = new ZendeskController(profileService, tokenService);

    const response = await controller.getZendeskSupportToken(req);
    expect(response.kind).toEqual("IResponseErrorInternal");
    if (response.kind === "IResponseErrorInternal") {
      expect(response.detail).toEqual(
        "Internal server error: Error retrieving a user profile with validated email address | Error retrieving user profile"
      );
    }
  });

  it("should return a IResponseErrorInternal if getProfile promise gets resolved with a IResponseErrorInternal", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseErrorInternal("Any Error"))
    );

    req.user = mockedRequestUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const tokenService = new TokenService();
    const controller = new ZendeskController(profileService, tokenService);

    const response = await controller.getZendeskSupportToken(req);

    // getUserDataProcessing is not called
    expect(response.kind).toEqual("IResponseErrorInternal");
    if (response.kind === "IResponseErrorInternal") {
      expect(response.detail).toEqual("Internal server error: Error retrieving a user profile with validated email address | Error retrieving user profile | Internal server error: Any Error");
    }
  });

  it("should return a IResponseErrorInternal if getProfile promise gets resolved with a IResponseErrorTooManyRequests", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseErrorTooManyRequests("Rate limit triggered"))
    );

    req.user = mockedRequestUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const tokenService = new TokenService();
    const controller = new ZendeskController(profileService, tokenService);

    const response = await controller.getZendeskSupportToken(req);

    // getUserDataProcessing is not called
    expect(response.kind).toEqual("IResponseErrorInternal");
    if (response.kind === "IResponseErrorInternal") {
      expect(response.detail).toEqual(
        "Internal server error: Error retrieving a user profile with validated email address | Error retrieving user profile | Too many requests: Rate limit triggered"
      );
    }
  });

  it("should return a IResponseErrorInternal if getProfile promise gets resolved with a IResponseErrorNotFound", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(
        ResponseErrorNotFound("User not found", "Cannot find user")
      )
    );

    req.user = mockedRequestUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const tokenService = new TokenService();
    const controller = new ZendeskController(profileService, tokenService);

    const response = await controller.getZendeskSupportToken(req);

    expect(response.kind).toEqual("IResponseErrorInternal");
    if (response.kind === "IResponseErrorInternal") {
      expect(response.detail).toEqual("Internal server error: Error retrieving a user profile with validated email address | Error retrieving user profile | User not found: Cannot find user");
    }
  });

  it("should return a IResponseErrorValidation if request's user cannot be validated", async () => {
    const req = mockReq();

    req.user = {};

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const tokenService = new TokenService();
    const controller = new ZendeskController(profileService, tokenService);

    const response = await controller.getZendeskSupportToken(req);

    expect(response.kind).toEqual("IResponseErrorValidation");
  });
});
