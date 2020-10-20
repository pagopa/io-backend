import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { PagoPAUser } from "../../../generated/pagopa/PagoPAUser";

import mockReq from "../../__mocks__/request";

import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { InitializedProfile } from "../../../generated/backend/InitializedProfile";
import { IsInboxEnabled } from "../../../generated/io-api/IsInboxEnabled";
import { IsWebhookEnabled } from "../../../generated/io-api/IsWebhookEnabled";
import {
  PreferredLanguage,
  PreferredLanguageEnum
} from "../../../generated/io-api/PreferredLanguage";
import ApiClientFactory from "../../services/apiClientFactory";
import ProfileService from "../../services/profileService";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import PagoPAController from "../pagoPAController";

const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const aSpidEmailAddress = "garibaldi@example.com" as EmailAddress;
const aCustomEmailAddress = "giuseppe.garibaldi@example.com" as EmailAddress;
const aMobilePhone = "3222222222222" as NonEmptyString;
const aValidName = "Giuseppe Maria";
const aValidFamilyname = "Garibaldi";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: aValidFamilyname,
  fiscal_code: aFiscalNumber,
  name: aValidName,
  session_token: "123hexToken" as SessionToken,
  spid_email: aSpidEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: aMobilePhone,
  wallet_token: "123hexToken" as WalletToken
};

const proxyUserResponse: PagoPAUser = {
  family_name: aValidFamilyname,
  fiscal_code: aFiscalNumber,
  mobile_phone: aMobilePhone,
  name: aValidName,
  notice_email: aCustomEmailAddress,
  spid_email: aSpidEmailAddress
};

const anIsInboxEnabled = true as IsInboxEnabled;
const anIsWebookEnabled = true as IsWebhookEnabled;
const aPreferredLanguages: ReadonlyArray<PreferredLanguage> = [
  PreferredLanguageEnum.it_IT
];

const userInitializedProfile: InitializedProfile = {
  email: aCustomEmailAddress,
  family_name: aValidFamilyname,
  fiscal_code: aFiscalNumber,
  has_profile: true,
  is_email_enabled: true,
  is_email_validated: true,
  is_inbox_enabled: anIsInboxEnabled,
  is_webhook_enabled: anIsWebookEnabled,
  name: aValidName,
  preferred_languages: aPreferredLanguages,
  spid_mobile_phone: aMobilePhone,
  version: 42
};

const mockGetProfile = jest.fn();
jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getProfile: mockGetProfile
    }))
  };
});

describe("PagoPaController#getUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a successful response with validated email", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(userInitializedProfile))
    );

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const apiClient = new ApiClientFactory("", "");
    const profileService = new ProfileService(apiClient);
    const pagoPAController = new PagoPAController(profileService);

    const response = await pagoPAController.getUser(req);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyUserResponse
    });
  });

  it("should return a successful response with notice_email equals to spid_email when user email is unverified", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(
        // Return an InitializedProfile with non validated email
        ResponseSuccessJson({
          ...userInitializedProfile,
          is_email_validated: false
        })
      )
    );

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const apiClient = new ApiClientFactory("", "");
    const profileService = new ProfileService(apiClient);
    const pagoPAController = new PagoPAController(profileService);

    const response = await pagoPAController.getUser(req);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      // Custom Email is not provided becouse not yet validated
      value: {
        ...proxyUserResponse,
        notice_email: mockedUser.spid_email
      }
    });
  });

  it("should return a validation error response when user email is not verified and spid_email is not available", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(
        // Return an InitializedProfile with non validated email
        ResponseSuccessJson({
          ...userInitializedProfile,
          is_email_validated: false
        })
      )
    );

    // A session user info without spid email available
    const notSpidUserSessionUser: User = {
      ...mockedUser,
      spid_email: undefined
    };
    // tslint:disable-next-line: no-object-mutation
    req.user = notSpidUserSessionUser;

    const apiClient = new ApiClientFactory("", "");
    const profileService = new ProfileService(apiClient);
    const pagoPAController = new PagoPAController(profileService);

    const response = await pagoPAController.getUser(req);
    expect(mockGetProfile).toHaveBeenCalledWith(notSpidUserSessionUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: "Validation Error: Invalid User Data",
      kind: "IResponseErrorValidation"
    });
  });
});
