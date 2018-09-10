/* tslint:disable:no-any */

import { isLeft, isRight } from "fp-ts/lib/Either";
import mockReq from "../../__mocks__/request";

import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { EmailAddress } from "../api/EmailAddress";
import { ExtendedProfile } from "../api/ExtendedProfile";
import { FiscalCode } from "../api/FiscalCode";
import { IsInboxEnabled } from "../api/IsInboxEnabled";
import { IsWebhookEnabled } from "../api/IsWebhookEnabled";
import {
  PreferredLanguage,
  PreferredLanguageEnum
} from "../api/PreferredLanguage";
import { SpidLevelEnum } from "../api/SpidLevel";
import { Version } from "../api/Version";
import { GetProfileOKResponse } from "../api_client/getProfileOKResponse";
import {
  extractUpsertProfileFromRequest,
  toAppProfileWithCDData,
  toProfileWithoutCDData
} from "../profile";
import { SessionToken, WalletToken } from "../token";
import { User } from "../user";

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aVersion = 1 as Version;
const aPreferredLanguages: ReadonlyArray<PreferredLanguage> = [
  PreferredLanguageEnum.it_IT
];
const anIsWebhookEnabled = true as IsWebhookEnabled;
const anIsInboxEnabled = true as IsInboxEnabled;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for the profile retrieved from the Digital Citizenship API
const mockedGetProfileOKResponse: GetProfileOKResponse = {
  email: anEmailAddress,
  isInboxEnabled: anIsInboxEnabled,
  isWebhookEnabled: anIsWebhookEnabled,
  preferredLanguages: aPreferredLanguages,
  version: aVersion
};

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
const mockedExtendedProfile: ExtendedProfile = {
  email: anEmailAddress,
  is_inbox_enabled: anIsInboxEnabled,
  is_webhook_enabled: anIsWebhookEnabled,
  preferred_languages: aPreferredLanguages,
  version: 1 as Version
};

describe("profile type", () => {
  /*test case: Converts an empty API profile to a Proxy profile using only the user data extracted from SPID.*/
  it("should get an app Proxy profile without email from user data extracted from SPID", async () => {
    // validate SpidUser. Return right.
    const userData = toProfileWithoutCDData(
      mockedUser // user
    );

    expect(userData).toEqual({
      spid_data: {
        family_name: mockedUser.family_name,
        fiscal_code: mockedUser.fiscal_code,
        name: mockedUser.name,
        spid_email: mockedUser.spid_email,
        spid_mobile_phone: mockedUser.spid_mobile_phone
      }
    });
  });

  /*test case: Converts an existing API profile to a Proxy profile using user profile with email from Digital Citzen API and SPID*/
  it("should get an app Proxy profile user profile with email from Digital Citzen API and SPID", async () => {
    // return app Proxy Profile.
    const userData = toAppProfileWithCDData(
      mockedGetProfileOKResponse, // from
      mockedUser // user
    );

    expect(userData).toEqual({
      ...toProfileWithoutCDData(mockedUser),
      cd_data: {
        blocked_inbox_or_channels:
          mockedGetProfileOKResponse.blockedInboxOrChannels,
        email: mockedGetProfileOKResponse.email,
        is_inbox_enabled: mockedGetProfileOKResponse.isInboxEnabled,
        is_webhook_enabled: mockedGetProfileOKResponse.isWebhookEnabled,
        preferred_languages: mockedGetProfileOKResponse.preferredLanguages,
        version: mockedGetProfileOKResponse.version
      }
    });
  });

  /*test case: Extracts a user profile from the body of a request.*/
  it("should get a user upsert profile from request", async () => {
    // Express request mock
    const req = mockReq();

    // populate mock request with user Extended Profile
    req.body = mockedExtendedProfile;

    // extract the upsert user data from Express request with correct values. Return right.
    const userDataOK = extractUpsertProfileFromRequest(req);

    expect(isRight(userDataOK)).toBeTruthy();
    if (isRight(userDataOK)) {
      expect(userDataOK._tag).toBe("Right");
      expect(userDataOK.value).toEqual(mockedExtendedProfile);
    }

    // extract the upsert user data from Express request with incorrect values. Return left.
    req.body.email = "it.is.not.an.email";
    const userDataKO = extractUpsertProfileFromRequest(req);
    expect(isLeft(userDataKO)).toBeTruthy();
    if (isLeft(userDataKO)) {
      expect(userDataKO._tag).toBe("Left");
    }
  });
});
