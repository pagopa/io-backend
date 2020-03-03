/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */
/* tslint:disable:no-inferred-empty-object-type */

import { isLeft, isRight } from "fp-ts/lib/Either";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import mockReq from "../../__mocks__/request";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { ExtendedProfile as ExtendedProfileBackend } from "../../../generated/backend/ExtendedProfile";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { IsInboxEnabled } from "../../../generated/backend/IsInboxEnabled";
import { IsWebhookEnabled } from "../../../generated/backend/IsWebhookEnabled";
import {
  PreferredLanguage,
  PreferredLanguageEnum
} from "../../../generated/backend/PreferredLanguage";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { Version } from "../../../generated/backend/Version";

import { ExtendedProfile as ExtendedProfileApi } from "../../../generated/io-api/ExtendedProfile";

import { ResponseErrorNotFound } from "italia-ts-commons/lib/responses";
import { AcceptedTosVersion } from "../../../generated/backend/AcceptedTosVersion";
import { IsEmailEnabled } from "../../../generated/backend/IsEmailEnabled";
import { IsEmailValidated } from "../../../generated/backend/IsEmailValidated";
import {
  notFoundProfileToInternalServerError,
  profileMissingErrorResponse,
  toInitializedProfile
} from "../profile";
import { SessionToken, WalletToken } from "../token";
import { User } from "../user";

const aTosVersion = 1 as AcceptedTosVersion;
const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aPreferredLanguages: ReadonlyArray<PreferredLanguage> = [
  PreferredLanguageEnum.it_IT
];
const anIsWebhookEnabled = true as IsWebhookEnabled;
const anIsInboxEnabled = true as IsInboxEnabled;
const anIsEmailEnabled = true as IsEmailEnabled;
const anIsEmailValidated = true as IsEmailValidated;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for a valid User extracted from SPID
const mockedUser: User = {
  created_at: 1183518855,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  session_token: "HexToKen" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "HexToKen" as WalletToken
};

// mock for a valid ExtendedProfile profile
const mockedExtendedProfile: ExtendedProfileApi = {
  accepted_tos_version: aTosVersion,
  email: anEmailAddress,
  is_email_enabled: anIsEmailEnabled,
  is_email_validated: anIsEmailValidated,
  is_inbox_enabled: anIsInboxEnabled,
  is_webhook_enabled: anIsWebhookEnabled,
  preferred_languages: aPreferredLanguages,
  version: 1 as Version
};

// mock for a valid ExtendedProfile profile used for ToS test
const mockedExtendedProfileWithoutTos: ExtendedProfileApi = {
  email: anEmailAddress,
  is_email_enabled: anIsEmailEnabled,
  is_email_validated: anIsEmailValidated,
  is_inbox_enabled: anIsInboxEnabled,
  is_webhook_enabled: anIsWebhookEnabled,
  preferred_languages: aPreferredLanguages,
  version: 1 as Version
};

describe("profile type", () => {
  /*test case: Converts an existing API profile to a Proxy profile using user profile with email from Digital Citzen API and SPID*/
  it("should get an app Proxy profile user profile with email from Digital Citzen API and SPID", async () => {
    // return app Proxy Profile.
    const userData = toInitializedProfile(
      mockedExtendedProfile, // from
      mockedUser // user
    );

    expect(userData.accepted_tos_version).toBe(
      mockedExtendedProfile.accepted_tos_version
    );
    expect(userData.email).toBe(mockedExtendedProfile.email);
    expect(userData.family_name).toBe(mockedUser.family_name);
    expect(userData.fiscal_code).toBe(mockedUser.fiscal_code);
    expect(userData.has_profile).toBeTruthy();
    expect(userData.is_email_enabled).toBe(anIsEmailEnabled);
    expect(userData.is_inbox_enabled).toBe(
      mockedExtendedProfile.is_inbox_enabled
    );
    expect(userData.is_webhook_enabled).toBe(
      mockedExtendedProfile.is_webhook_enabled
    );
    expect(userData.name).toBe(mockedUser.name);
    expect(userData.spid_email).toBe(mockedUser.spid_email);
    expect(userData.preferred_languages).toBe(
      mockedExtendedProfile.preferred_languages
    );
    expect(userData.version).toBe(mockedExtendedProfile.version);
  });

  /*test case: Extracts a user profile from the body of a request.*/
  it("should get a user upsert profile from request", async () => {
    // Express request mock
    const req = mockReq();

    // populate mock request with user Extended Profile
    req.body = mockedExtendedProfile;

    // extract the upsert user data from Express request with correct values. Return right.
    const userDataOK = ExtendedProfileBackend.decode(req.body);

    expect(isRight(userDataOK)).toBeTruthy();
    if (isRight(userDataOK)) {
      expect(userDataOK._tag).toBe("Right");
      expect(userDataOK.value).toEqual(mockedExtendedProfile);
    }

    // extract the upsert user data from Express request with incorrect values. Return left.
    req.body.email = "it.is.not.an.email";
    const userDataKO = ExtendedProfileBackend.decode(req.body);
    expect(isLeft(userDataKO)).toBeTruthy();
    if (isLeft(userDataKO)) {
      expect(userDataKO._tag).toBe("Left");
    }
  });

  it("should get an app Proxy profile without tos", async () => {
    // return app Proxy Profile.
    const userData = toInitializedProfile(
      mockedExtendedProfileWithoutTos, // from
      mockedUser // user
    );

    expect(userData.accepted_tos_version).toBe(undefined);
    expect(userData.is_email_enabled).toBe(anIsEmailEnabled);
  });

  /*test case: Converts an empty API profile to a Proxy profile using only the user data extracted from SPID.*/
  it("should get an ResponseErrorInternal if profile is not found", async () => {
    // validate SpidUser. Return right.
    const response = notFoundProfileToInternalServerError(
      ResponseErrorNotFound("Not found", "Profile not found")
    );

    expect(response).toEqual({
      ...profileMissingErrorResponse,
      apply: expect.any(Function)
    });
  });
});
