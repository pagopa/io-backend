import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { EmailAddress } from "../../generated/backend/EmailAddress";
import { SpidLevelEnum } from "../../generated/backend/SpidLevel";
import { SessionToken, WalletToken } from "../types/token";
import { User } from "../types/user";

const aTimestamp = 1518010929530;
const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidName = "Giuseppe Maria" as NonEmptyString;
const aValidFamilyname = "Garibaldi" as NonEmptyString;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for a valid User
export const aMockedUser: User = {
  created_at: aTimestamp,
  family_name: aValidFamilyname,
  fiscal_code: aFiscalCode,
  name: aValidName,
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "123hexToken" as WalletToken
};
