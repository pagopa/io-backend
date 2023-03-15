import * as t from "io-ts";
import { IsInboxEnabled } from "../../../generated/backend/IsInboxEnabled";
import { IsWebhookEnabled } from "../../../generated/backend/IsWebhookEnabled";
import {
  PreferredLanguage,
  PreferredLanguageEnum
} from "../../../generated/backend/PreferredLanguage";
import { Profile } from "../../../generated/backend/Profile";
import { PushNotificationsContentTypeEnum } from "../../../generated/backend/PushNotificationsContentType";
import { ReminderStatusEnum } from "../../../generated/backend/ReminderStatus";
import { ServicePreferencesSettings } from "../../../generated/backend/ServicePreferencesSettings";
import { ServicesPreferencesModeEnum } from "../../../generated/backend/ServicesPreferencesMode";
import { AppVersion } from "@pagopa/io-functions-app-sdk/AppVersion";
import { ExtendedProfile as ExtendedProfileApi } from "@pagopa/io-functions-app-sdk/ExtendedProfile";
import { NewProfile } from "@pagopa/io-functions-app-sdk/NewProfile";
import { APIClient } from "../../clients/api";
import { toInitializedProfile } from "../../types/profile";
import {
  mockedUser,
  aFiscalCode,
  anEmailAddress,
  aSpidEmailAddress,
  aValidName,
  aValidFamilyname
} from "../../__mocks__/user_mock";
import ApiClientFactory from "../apiClientFactory";
import ProfileService from "../profileService";

const aValidAPIEmail = anEmailAddress;
const aValidSPIDEmail = aSpidEmailAddress;
const anIsInboxEnabled = true as IsInboxEnabled;
const anIsWebookEnabled = true as IsWebhookEnabled;
const aPreferredLanguages: ReadonlyArray<PreferredLanguage> = [
  PreferredLanguageEnum.it_IT
];
const aServicePreferencesSettings: ServicePreferencesSettings = {
  mode: ServicesPreferencesModeEnum.AUTO
};

const validApiProfile: ExtendedProfileApi = {
  email: aValidAPIEmail,
  is_email_enabled: true,
  is_email_validated: true,
  is_inbox_enabled: true,
  is_webhook_enabled: true,
  preferred_languages: aPreferredLanguages,
  service_preferences_settings: aServicePreferencesSettings,
  version: 42
};

const validApiProfileResponse = {
  status: 200,
  value: validApiProfile
};

const lastAppVersion = "0.0.1" as AppVersion;

const validApiProfileResponseWithLastAppVersion = {
  status: 200,
  value: { ...validApiProfile, last_app_version: lastAppVersion }
};

const validApiProfileResponseWithReminderStatus = {
  status: 200,
  value: { ...validApiProfile, reminder_status: "DISABLED" }
};

const validApiProfileResponseWithPushNotificationsContentType = {
  status: 200,
  value: {
    ...validApiProfile,
    push_notifications_content_type: PushNotificationsContentTypeEnum.ANONYMOUS
  }
};

const proxyInitializedProfileResponse = {
  blocked_inbox_or_channels: undefined,
  email: aValidAPIEmail,
  family_name: aValidFamilyname,
  fiscal_code: aFiscalCode,
  has_profile: true,
  is_email_validated: true,
  is_inbox_enabled: true,
  is_webhook_enabled: true,
  name: aValidName,
  preferred_languages: aPreferredLanguages,
  spid_email: aValidSPIDEmail,
  version: 42
};

const updateProfileRequest: Profile = {
  email: aValidAPIEmail,
  is_email_enabled: true,
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

const conflictApiMessagesResponse = {
  status: 409
};

const expectedApiError = new Error("Api error.");

const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();
const mockCreateProfile = jest.fn();
const mockStartEmailValidationProcess = jest.fn();

// partial because we may not mock every method
const mockClient: Partial<ReturnType<APIClient>> = {
  createProfile: mockCreateProfile,
  startEmailValidationProcess: mockStartEmailValidationProcess,
  getProfile: mockGetProfile,
  updateProfile: mockUpdateProfile
};
jest.mock("../../services/apiClientFactory", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getClient: () => mockClient
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
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyInitializedProfileResponse
    });
  });

  it("returns a user profile from the API with last_app_version", async () => {
    mockGetProfile.mockImplementation(() =>
      t.success(validApiProfileResponseWithLastAppVersion)
    );

    const service = new ProfileService(api);

    const res = await service.getProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        ...proxyInitializedProfileResponse,
        last_app_version: lastAppVersion
      }
    });
  });

  it("returns a user profile from the API with reminder_status", async () => {
    mockGetProfile.mockImplementation(() =>
      t.success(validApiProfileResponseWithReminderStatus)
    );

    const service = new ProfileService(api);

    const res = await service.getProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        ...proxyInitializedProfileResponse,
        reminder_status: "DISABLED"
      }
    });
  });

  it("returns a user profile from the API with push_notifications_content_type", async () => {
    mockGetProfile.mockImplementation(() =>
      t.success(validApiProfileResponseWithPushNotificationsContentType)
    );

    const service = new ProfileService(api);

    const res = await service.getProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        ...proxyInitializedProfileResponse,
        push_notifications_content_type:
          PushNotificationsContentTypeEnum.ANONYMOUS
      }
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
      fiscal_code: mockedUser.fiscal_code
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
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: validApiProfileResponse.value
    });
  });

  it("returns a user profile from the API with last_app_version", async () => {
    mockGetProfile.mockImplementation(() =>
      t.success(validApiProfileResponseWithLastAppVersion)
    );

    const service = new ProfileService(api);

    const res = await service.getApiProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        ...validApiProfileResponse.value,
        last_app_version: lastAppVersion
      }
    });
  });

  it("returns a user profile from the API with reminder_status", async () => {
    mockGetProfile.mockImplementation(() =>
      t.success(validApiProfileResponseWithReminderStatus)
    );

    const service = new ProfileService(api);

    const res = await service.getApiProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        ...validApiProfileResponse.value,
        reminder_status: "DISABLED"
      }
    });
  });

  it("returns a user profile from the API with push_notifications_content_type", async () => {
    mockGetProfile.mockImplementation(() =>
      t.success(validApiProfileResponseWithPushNotificationsContentType)
    );

    const service = new ProfileService(api);

    const res = await service.getApiProfile(mockedUser);

    expect(mockGetProfile).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        ...validApiProfileResponse.value,
        push_notifications_content_type:
          PushNotificationsContentTypeEnum.ANONYMOUS
      }
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
      fiscal_code: mockedUser.fiscal_code
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
      fiscal_code: mockedUser.fiscal_code,
      body: updateProfileRequest
    });

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyInitializedProfileResponse
    });
  });

  it("update an user profile to the API with new last_app_version", async () => {
    mockUpdateProfile.mockImplementation(() =>
      t.success(validApiProfileResponseWithLastAppVersion)
    );

    const service = new ProfileService(api);

    const res = await service.updateProfile(mockedUser, {
      ...updateProfileRequest,
      last_app_version: lastAppVersion
    });

    expect(mockUpdateProfile).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      body: {
        ...updateProfileRequest,
        last_app_version: lastAppVersion
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        ...proxyInitializedProfileResponse,
        last_app_version: lastAppVersion
      }
    });
  });

  it("update an user profile to the API with reminder status", async () => {
    mockUpdateProfile.mockImplementation(() =>
      t.success(validApiProfileResponseWithReminderStatus)
    );

    const service = new ProfileService(api);

    const res = await service.updateProfile(mockedUser, {
      ...updateProfileRequest,
      reminder_status: ReminderStatusEnum.DISABLED
    });

    expect(mockUpdateProfile).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      body: {
        ...updateProfileRequest,
        reminder_status: ReminderStatusEnum.DISABLED
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        ...proxyInitializedProfileResponse,
        reminder_status: ReminderStatusEnum.DISABLED
      }
    });
  });

  it("update an user profile to the API with push notifications content type", async () => {
    mockUpdateProfile.mockImplementation(() =>
      t.success(validApiProfileResponseWithPushNotificationsContentType)
    );

    const service = new ProfileService(api);

    const res = await service.updateProfile(mockedUser, {
      ...updateProfileRequest,
      push_notifications_content_type:
        PushNotificationsContentTypeEnum.ANONYMOUS
    });

    expect(mockUpdateProfile).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      body: {
        ...updateProfileRequest,
        push_notifications_content_type:
          PushNotificationsContentTypeEnum.ANONYMOUS
      }
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        ...proxyInitializedProfileResponse,
        push_notifications_content_type:
          PushNotificationsContentTypeEnum.ANONYMOUS
      }
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

  it("returns an 409 HTTP error from updateProfile upstream API", async () => {
    mockUpdateProfile.mockImplementation(() =>
      t.success(conflictApiMessagesResponse)
    );

    const service = new ProfileService(api);

    const res = await service.updateProfile(mockedUser, updateProfileRequest);

    expect(res.kind).toEqual("IResponseErrorConflict");
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
      fiscal_code: mockedUser.fiscal_code,
      body: createProfileRequest
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {}
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

  it("returns an 409 HTTP error from createProfile upstream API", async () => {
    mockCreateProfile.mockImplementation(() =>
      t.success(conflictApiMessagesResponse)
    );

    const service = new ProfileService(api);

    const res = await service.createProfile(mockedUser, createProfileRequest);

    expect(res.kind).toEqual("IResponseErrorConflict");
  });
});

describe("ProfileService#emailValidationProcess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should returns ResponseSuccessAccepted if no error occours", async () => {
    mockStartEmailValidationProcess.mockImplementation(() =>
      t.success(acceptedApiResponse)
    );

    const service = new ProfileService(api);

    const res = await service.emailValidationProcess(mockedUser);

    expect(mockStartEmailValidationProcess).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessAccepted"
    });
  });

  it("returns 404 response if the 404 was provided from the functions API", async () => {
    mockStartEmailValidationProcess.mockImplementation(() =>
      t.success(notFoundApiResponse)
    );

    const service = new ProfileService(api);

    const res = await service.emailValidationProcess(mockedUser);

    expect(mockStartEmailValidationProcess).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      detail: "Not found: User not found.",
      kind: "IResponseErrorNotFound"
    });
  });

  it("returns an 429 HTTP error from emailValidationProcess upstream API", async () => {
    mockStartEmailValidationProcess.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new ProfileService(api);

    const res = await service.emailValidationProcess(mockedUser);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });
});

describe("ProfileService#toInitializedProfile", () => {
  it("should format invalid date", async () => {
    const profile = toInitializedProfile(validApiProfile, {
      ...mockedUser,
      date_of_birth: "1980-10-1"
    });

    expect(profile.date_of_birth).toEqual(new Date("1980-10-01T00:00:00.000Z"));
  });
});
