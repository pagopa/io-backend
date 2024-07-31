/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */
/* tslint:disable:no-inferred-empty-object-type */

import * as E from "fp-ts/lib/Either";
import mockReq from "../../__mocks__/request";

import { User } from "../user";
import { mockedUser } from "../../__mocks__/user_mock";

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
