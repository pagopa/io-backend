/* tslint:disable:no-any */

import { Either, isLeft, isRight } from "fp-ts/lib/Either";
import mockReq from "../../__mocks__/request";

import { EmailAddress } from "../api/EmailAddress";
import { FiscalCode } from "../api/FiscalCode";
import { Issuer } from "../issuer";
import {
  extractUserFromJson,
  extractUserFromRequest,
  toAppUser,
  User,
  validateSpidUser
} from "../user";

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "x@example.com" as EmailAddress;
const anIssuer = { _: "onelogin_saml" } as Issuer;
const SESSION_TOKEN_LENGTH_BYTES = 48;
const SESSION_TOKEN_LENGTH_STRING = SESSION_TOKEN_LENGTH_BYTES * 2; // token is in hex bytes
const aValidSpidLevel = "https://www.spid.gov.it/SpidL2";

// mock for a valid SpidUser
const mockedSpidUser: any = {
  authnContextClassRef: aValidSpidLevel,
  email: anEmailAddress,
  familyName: "Garibaldi",
  fiscalNumber: aFiscalNumber,
  issuer: anIssuer,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  sessionIndex: "sessionIndex"
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
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: anEmailAddress,
  sessionIndex: "sessionIndex",
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  token: "HexToKen"
};

const mockToken =
  "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b";

describe("user type", () => {
  /*test case: extract User info from Spid user*/
  it("should get a user from SpidUser with toUser", async () => {
    // extract User from Spiduser
    const userData = toAppUser(mockedSpidUser, mockToken);

    expect(userData.token).toHaveLength(SESSION_TOKEN_LENGTH_STRING);
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
    const userData = extractUserFromRequest(req);

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
    const userDataOK: Either<Error, User> = extractUserFromJson(
      JSON.stringify(mockedUser)
    );

    expect(isRight(userDataOK)).toBeTruthy();
    if (isRight(userDataOK)) {
      expect(userDataOK._tag).toBe("Right");

      expect(userDataOK.value.token).toBe(mockedUser.token);
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
