/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */
/* tslint:disable:no-inferred-empty-object-type */

import { Either, isLeft, isRight } from "fp-ts/lib/Either";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import mockReq from "../../__mocks__/request";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { Issuer } from "../issuer";
import { SessionToken, WalletToken } from "../token";
import {
  extractUserFromJson,
  toAppUser,
  User,
  validateSpidUser
} from "../user";

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "x@example.com" as EmailAddress;
const anIssuer = { _: "onelogin_saml" } as Issuer;
const SESSION_TOKEN_LENGTH_BYTES = 48;
const SESSION_TOKEN_LENGTH_STRING = SESSION_TOKEN_LENGTH_BYTES * 2; // token is in hex bytes
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for a valid SpidUser
const mockedSpidUser: any = {
  authnContextClassRef: aValidSpidLevel,
  email: anEmailAddress,
  familyName: "Garibaldi",
  fiscalNumber: aFiscalNumber,
  getAssertionXml: () => "",
  issuer: anIssuer,
  mobilePhone: "3222222222222",
  name: "Giuseppe Maria"
};

// mock for a invalid SpidUser
const mockedInvalidSpidUser: any = {
  aKey: "aValue"
};

// mock for a valid User
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

const mockSessionToken = "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b" as SessionToken;
const mockWalletToken = "b1d8fbe93cc465e9dac98ff77018062d83d5f276279c0eea41960ed6e4199d4ce7ac51fcde4ea4a4755d09f621723388" as WalletToken;

describe("user type", () => {
  /*test case: extract User info from Spid user*/
  it("should get a user from SpidUser with toUser", async () => {
    // extract User from Spiduser
    const userData = toAppUser(
      mockedSpidUser,
      mockSessionToken,
      mockWalletToken
    );

    expect(userData.session_token).toHaveLength(SESSION_TOKEN_LENGTH_STRING);
    expect(userData.fiscal_code).toBe(mockedSpidUser.fiscalNumber);
    expect(userData.created_at).toBeDefined();
  });

  /* test case: extract user info from Express request */
  it("should get a user from Express request with extractUserFromRequest", async () => {
    // Express request mock
    const req = mockReq();

    // populate mock request with User
    req.user = mockedUser;

    // extract the user data from Express request
    const userData = User.decode(req.user);

    expect(isRight(userData)).toBeTruthy();
    if (isRight(userData)) {
      expect(userData._tag).toBe("Right");
      expect(userData.value).toBe(req.user);
    }
  });

  /*test case: validate Spid user info*/
  it("should validate correct Spid user info with validateSpidUser", async () => {
    // validate SpidUser. Return right.
    const userDataOK = validateSpidUser(mockedSpidUser);

    expect(isRight(userDataOK)).toBeTruthy();
    if (isRight(userDataOK)) {
      expect(userDataOK._tag).toBe("Right");
    }

    // validate incorrect SpidUser(User). Return left.
    const userDataKO = validateSpidUser(mockedInvalidSpidUser);

    expect(isLeft(userDataKO)).toBeTruthy();
    if (isLeft(userDataKO)) {
      expect(userDataKO._tag).toBe("Left");
    }
  });

  /*test case: extract User from json string*/
  it("should get a user from a correct Json string with extractUserFromJson", async () => {
    // extract User from correct JSON string. Return right.
    const userDataOK: Either<string, User> = extractUserFromJson(
      JSON.stringify(mockedUser)
    );

    expect(isRight(userDataOK)).toBeTruthy();
    if (isRight(userDataOK)) {
      expect(userDataOK._tag).toBe("Right");

      expect(userDataOK.value.session_token).toBe(mockedUser.session_token);
      expect(userDataOK.value.fiscal_code).toBe(mockedUser.fiscal_code);
      expect(userDataOK.value).toEqual(mockedUser);

      expect(userDataOK.value.created_at).toBeDefined();
    }

    // extract User from wrong JSON string. Return left.
    const userDataKO = extractUserFromJson(JSON.stringify(mockedSpidUser));
    expect(isLeft(userDataKO)).toBeTruthy();
    if (isLeft(userDataKO)) {
      expect(userDataKO._tag).toBe("Left");
    }
  });
});
