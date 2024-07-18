/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */
/* tslint:disable:no-inferred-empty-object-type */

import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/Option";
import mockReq from "../../__mocks__/request";

import { getAuthnContextFromResponse, User } from "../user";
import { mockedUser } from "../../__mocks__/user_mock";
import {
  aSAMLResponse,
  aSAMLResponse_saml2Namespace,
} from "../../utils/__mocks__/spid";

describe("user type", () => {
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
});

describe("getAuthnContextFromResponse", () => {
  it("should extract the Spid Level from a SAML Assertion with saml namespace", () => {
    const res = getAuthnContextFromResponse(aSAMLResponse);

    expect(res).toEqual(O.some("https://www.spid.gov.it/SpidL2"));
  });

  it("should extract the Spid Level from a SAML Assertion with saml2 namespace", () => {
    const res = getAuthnContextFromResponse(aSAMLResponse_saml2Namespace);

    expect(res).toEqual(O.some("https://www.spid.gov.it/SpidL2"));
  });
});
