/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */
/* tslint:disable:no-inferred-empty-object-type */

import * as E from "fp-ts/lib/Either";
import mockReq from "../../__mocks__/request";

import { Issuer } from "../issuer";
import {
  extractUserFromJson,
  toAppUser,
  User,
  validateSpidUser,
} from "../user";
import {
  mockBPDToken,
  mockedUser,
  mockFIMSToken,
  mockMyPortalToken,
  mockSessionToken,
  mockWalletToken,
  mockZendeskToken,
} from "../../__mocks__/user_mock";

const anIssuer = "onelogin_saml" as Issuer;
const SESSION_TOKEN_LENGTH_BYTES = 48;
const SESSION_TOKEN_LENGTH_STRING = SESSION_TOKEN_LENGTH_BYTES * 2; // token is in hex bytes

// mock for a valid SpidUser
const mockedSpidUser = {
  authnContextClassRef: mockedUser.spid_level,
  dateOfBirth: "2000-06-02",
  email: mockedUser.spid_email,
  familyName: mockedUser.family_name,
  fiscalNumber: mockedUser.fiscal_code,
  getAcsOriginalRequest: () => mockReq(),
  getAssertionXml: () => "",
  getSamlResponseXml: () => "",
  issuer: anIssuer,
  name: mockedUser.name,
};

// mock for a invalid SpidUser
const mockedInvalidSpidUser: any = {
  aKey: "aValue",
};

const mockSessionTrackingId = "324e25dcecebed6fewf2";

describe("user type", () => {
  /*test case: extract User info from Spid user*/
  it("should get a user from SpidUser with toUser", async () => {
    // extract User from Spiduser
    const userData = toAppUser(
      mockedSpidUser,
      mockSessionToken,
      mockWalletToken,
      mockMyPortalToken,
      mockBPDToken,
      mockZendeskToken,
      mockFIMSToken,
      mockSessionTrackingId
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

    expect(E.isRight(userData)).toBeTruthy();
    if (E.isRight(userData)) {
      expect(userData._tag).toBe("Right");
      expect(userData.right).toBe(req.user);
    }
  });

  /*test case: validate Spid user info*/
  it("should validate correct Spid user info with validateSpidUser", async () => {
    // validate SpidUser. Return right.
    const userDataOK = validateSpidUser(mockedSpidUser);

    expect(E.isRight(userDataOK)).toBeTruthy();
    if (E.isRight(userDataOK)) {
      expect(userDataOK._tag).toBe("Right");
    }

    // validate incorrect SpidUser(User). Return left.
    const userDataKO = validateSpidUser(mockedInvalidSpidUser);

    expect(E.isLeft(userDataKO)).toBeTruthy();
    if (E.isLeft(userDataKO)) {
      expect(userDataKO._tag).toBe("Left");
    }
  });

  /*test case: extract User from json string*/
  it("should get a user from a correct Json string with extractUserFromJson", async () => {
    // extract User from correct JSON string. Return right.
    const userDataOK: E.Either<string, User> = extractUserFromJson(
      JSON.stringify(mockedUser)
    );

    expect(E.isRight(userDataOK)).toBeTruthy();
    if (E.isRight(userDataOK)) {
      expect(userDataOK._tag).toBe("Right");

      expect(userDataOK.right.session_token).toBe(mockedUser.session_token);
      expect(userDataOK.right.fiscal_code).toBe(mockedUser.fiscal_code);
      expect(userDataOK.right).toEqual(mockedUser);

      expect(userDataOK.right.created_at).toBeDefined();
    }

    // extract User from wrong JSON string. Return left.
    const userDataKO = extractUserFromJson(JSON.stringify(mockedSpidUser));
    expect(E.isLeft(userDataKO)).toBeTruthy();
    if (E.isLeft(userDataKO)) {
      expect(userDataKO._tag).toBe("Left");
    }
  });
});
