/* tslint:disable:no-any */

import { isLeft, isRight } from "fp-ts/lib/Either";
import mockReq from "../../__mocks__/request";

import { NonNegativeNumber } from "italia-ts-commons/lib/numbers";
import { SessionToken, WalletToken } from "../../services/ISessionStorage";
import { EmailAddress } from "../api/EmailAddress";
import { FiscalCode } from "../api/FiscalCode";
import { IsInboxEnabled } from "../api/IsInboxEnabled";
import { IsWebhookEnabled } from "../api/IsWebhookEnabled";
import {
  PreferredLanguage,
  PreferredLanguageEnum
} from "../api/PreferredLanguage";
import { SpidLevelEnum } from "../api/SpidLevel";
import { ExtendedProfile } from "../api_client/extendedProfile";
import { GetProfileOKResponse } from "../api_client/getProfileOKResponse";
import {
  extractUpsertProfileFromRequest,
  toAppProfileWithEmail,
  toAppProfileWithoutEmail
} from "../profile";
import { User } from "../user";

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aNonNegativeNumber = 1 as NonNegativeNumber;
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
  version: aNonNegativeNumber
};

// mock for a valid User extracted from SPID
const mockedUser: User = {
  created_at: 1183518855,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: anEmailAddress,
  sessionIndex: "sessionIndex",
  session_token: "HexToKen" as SessionToken,
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  wallet_token: "HexToKen" as WalletToken
};

// mock for a valid ExtendedProfile profile
const mockedExtendedProfile: ExtendedProfile = {
  email: anEmailAddress,
  isInboxEnabled: anIsInboxEnabled,
  isWebhookEnabled: anIsWebhookEnabled,
  preferredLanguages: aPreferredLanguages,
  version: 1 as number
};

describe("profile type", () => {
  /*test case: Converts an existing API profile to a Proxy profile using user profile with email from Digital Citzen API and SPID*/
  it("should get an app Proxy profile user profile with email from Digital Citzen API and SPID", async () => {
    // return app Proxy Profile.
    const userData = toAppProfileWithEmail(
      mockedGetProfileOKResponse, // from
      mockedUser // user
    );

    expect(userData.email).toBe(mockedGetProfileOKResponse.email);
    expect(userData.family_name).toBe(mockedUser.family_name);
    expect(userData.fiscal_code).toBe(mockedUser.fiscal_code);
    expect(userData.has_profile).toBeTruthy();
    expect(userData.is_email_set).toBeTruthy();
    expect(userData.is_inbox_enabled).toBe(
      mockedGetProfileOKResponse.isInboxEnabled
    );
    expect(userData.is_webhook_enabled).toBe(
      mockedGetProfileOKResponse.isWebhookEnabled
    );
    expect(userData.name).toBe(mockedUser.name);
    expect(userData.preferred_email).toBe(mockedUser.preferred_email);
    expect(userData.preferred_languages).toBe(
      mockedGetProfileOKResponse.preferredLanguages
    );
    expect(userData.version).toBe(mockedGetProfileOKResponse.version);
  });

  /*test case: Converts an empty API profile to a Proxy profile using only the user data extracted from SPID.*/
  it("should get an app Proxy profile without email from user data extracted from SPID", async () => {
    // validate SpidUser. Return right.
    const userData = toAppProfileWithoutEmail(
      mockedUser // user
    );

    expect(userData.family_name).toBe(mockedUser.family_name);
    expect(userData.fiscal_code).toBe(mockedUser.fiscal_code);
    expect(userData.has_profile).toBeFalsy();
    expect(userData.is_email_set).toBeFalsy();

    expect(userData.preferred_email).toBe(mockedUser.preferred_email);
    expect(userData.version).toBe(0);
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
