import {
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { InitializedProfile } from "../../../generated/backend/InitializedProfile";
import { IsInboxEnabled } from "../../../generated/backend/IsInboxEnabled";
import { IsWebhookEnabled } from "../../../generated/backend/IsWebhookEnabled";
import {
  PreferredLanguage,
  PreferredLanguageEnum
} from "../../../generated/backend/PreferredLanguage";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { PagoPAUser } from "../../../generated/pagopa/PagoPAUser";

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import ProfileService from "../../services/profileService";

import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import PagoPAController from "../pagoPAController";

const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aMobilePhone = "3222222222222" as NonEmptyString;
const aValidName = "Giuseppe Maria";
const aValidFamilyname = "Garibaldi";
const anIsInboxEnabled = true as IsInboxEnabled;
const anIsWebookEnabled = true as IsWebhookEnabled;
const aPreferredLanguages: ReadonlyArray<PreferredLanguage> = [
  PreferredLanguageEnum.it_IT
];
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: aValidFamilyname,
  fiscal_code: aFiscalNumber,
  name: aValidName,
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: aMobilePhone,
  wallet_token: "123hexToken" as WalletToken
};

const userInitializedProfile: InitializedProfile = {
  email: anEmailAddress,
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

const proxyUserResponse: PagoPAUser = {
  email: anEmailAddress,
  family_name: aValidFamilyname,
  mobile_phone: aMobilePhone,
  name: aValidName
};

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
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

  it("calls the getUser on the PagoPaController with valid values", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(userInitializedProfile))
    );

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
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

  it("should forward the response if an error occurs retrieving the profile", async () => {
    const req = mockReq();
    const expectedErrorResponse = ResponseErrorInternal("Error");

    mockGetProfile.mockReturnValue(Promise.resolve(expectedErrorResponse));

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const pagoPAController = new PagoPAController(profileService);

    const response = await pagoPAController.getUser(req);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual(expectedErrorResponse);
  });

  it("should return an error if no validated email is available for the user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetProfile.mockReturnValue(
      Promise.resolve(
        ResponseSuccessJson({
          ...userInitializedProfile,
          is_email_validated: false
        })
      )
    );
    const mockedUserWithoutSpidEmail = {
      ...mockedUser,
      spid_email: undefined
    };
    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUserWithoutSpidEmail;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const profileService = new ProfileService(apiClient);
    const pagoPAController = new PagoPAController(profileService);

    const response = await pagoPAController.getUser(req);
    response.apply(res);

    expect(mockGetProfile).toHaveBeenCalledWith(mockedUserWithoutSpidEmail);
    expect(res.json).toBeCalledWith(badRequestErrorResponse);
  });
});
