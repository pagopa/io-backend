import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { EmailAddress } from "../../generated/identity/EmailAddress";
import { InitializedProfile } from "../../generated/identity/InitializedProfile";
import { SpidLevelEnum } from "../../generated/backend/SpidLevel";
import { IsInboxEnabled } from "../../generated/io-profile/IsInboxEnabled";
import { IsWebhookEnabled } from "../../generated/io-profile/IsWebhookEnabled";
import {
  PreferredLanguage,
  PreferredLanguageEnum
} from "../../generated/io-profile/PreferredLanguage";
import { ServicePreferencesSettings } from "../../generated/io-profile/ServicePreferencesSettings";
import { ServicesPreferencesModeEnum } from "../../generated/io-profile/ServicesPreferencesMode";
import { SessionToken } from "../types/token";
import { User } from "../types/user";
import { UserIdentity } from "../../generated/io-auth/UserIdentity";

export const aTimestamp = 1518010929530;
export const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
export const anEmailAddress = "garibaldi@example.com" as EmailAddress;
export const aSpidEmailAddress = "garibaldi@spid.com" as EmailAddress;
export const aValidName = "Giuseppe Maria" as NonEmptyString;
export const aValidFamilyname = "Garibaldi" as NonEmptyString;
export const aValidDateofBirth = "2000-06-02";
export const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
export const aSessionTrackingId = "a-ssn-id";
export const mockSessionToken =
  "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b" as SessionToken;

// mock for a valid User
export const mockedUser: User = {
  family_name: aValidFamilyname,
  fiscal_code: aFiscalCode,
  name: aValidName,
  date_of_birth: aValidDateofBirth,
  spid_email: aSpidEmailAddress,
  spid_level: aValidSpidLevel,
  session_tracking_id: aSessionTrackingId
};

export const mockedUserIdentity: UserIdentity = {
  family_name: aValidFamilyname,
  fiscal_code: aFiscalCode,
  name: aValidName,
  date_of_birth: aValidDateofBirth,
  spid_email: aSpidEmailAddress,
  spid_level: aValidSpidLevel,
  session_tracking_id: aSessionTrackingId
};

export const aCustomEmailAddress = "custom-email@example.com" as EmailAddress;

export const anIsInboxEnabled = true as IsInboxEnabled;
export const anIsWebookEnabled = true as IsWebhookEnabled;
export const aPreferredLanguages: ReadonlyArray<PreferredLanguage> = [
  PreferredLanguageEnum.it_IT
];
export const aServicePreferencesSettings: ServicePreferencesSettings = {
  mode: ServicesPreferencesModeEnum.AUTO
};

export const mockedInitializedProfile: InitializedProfile = {
  email: aCustomEmailAddress,
  family_name: mockedUser.family_name,
  fiscal_code: mockedUser.fiscal_code,
  has_profile: true,
  is_email_enabled: true,
  is_email_validated: true,
  is_email_already_taken: true,
  is_inbox_enabled: anIsInboxEnabled,
  is_webhook_enabled: anIsWebookEnabled,
  name: mockedUser.name,
  preferred_languages: aPreferredLanguages,
  service_preferences_settings: aServicePreferencesSettings,
  version: 42
};
