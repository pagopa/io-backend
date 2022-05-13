import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { EmailAddress } from "../../generated/backend/EmailAddress";
import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import { SpidLevelEnum } from "../../generated/backend/SpidLevel";
import { IsInboxEnabled } from "../../generated/io-api/IsInboxEnabled";
import { IsWebhookEnabled } from "../../generated/io-api/IsWebhookEnabled";
import { PreferredLanguage, PreferredLanguageEnum } from "../../generated/io-api/PreferredLanguage";
import { ServicePreferencesSettings } from "../../generated/io-api/ServicePreferencesSettings";
import { ServicesPreferencesModeEnum } from "../../generated/io-api/ServicesPreferencesMode";
import {
  BPDToken,
  FIMSToken,
  MyPortalToken,
  SessionToken,
  WalletToken,
  ZendeskToken
} from "../types/token";
import { User } from "../types/user";

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
export const mockWalletToken =
  "5ba5b99a982da1aa5eb4fd8643124474fa17ee3016c13c617ab79d2e7c8624bb80105c0c0cae9864e035a0d31a715043" as WalletToken;
export const mockMyPortalToken =
  "c4d6bc16ef30211fb3fa8855efecac21be04a7d032f8700d" as MyPortalToken;
export const mockBPDToken = "4123ee213b64955212ea59e3beeaad1e5fdb3a36d2210416" as BPDToken;
export const mockZendeskToken =
  "aaaa12213b64955212ea59e3beeaad1e5fdb3a36d2210abc" as ZendeskToken;
export const mockFIMSToken =
  "aaaa12213b64955212ea59e3beeaad1e5fdb3a36d2210bcd" as FIMSToken;

// mock for a valid User
export const mockedUser: User = {
  created_at: aTimestamp,
  family_name: aValidFamilyname,
  fiscal_code: aFiscalCode,
  name: aValidName,
  date_of_birth: aValidDateofBirth,
  session_token: mockSessionToken,
  spid_email: aSpidEmailAddress,
  spid_level: aValidSpidLevel,
  wallet_token: mockWalletToken,
  myportal_token: mockMyPortalToken,
  bpd_token: mockBPDToken,
  zendesk_token: mockZendeskToken,
  fims_token: mockFIMSToken,
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
  is_inbox_enabled: anIsInboxEnabled,
  is_webhook_enabled: anIsWebookEnabled,
  name: mockedUser.name,
  preferred_languages: aPreferredLanguages,
  service_preferences_settings: aServicePreferencesSettings,
  version: 42
};
