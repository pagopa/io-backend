import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { getByXUserToken } from "../x-user-token";
import { mockedUserIdentity } from "../../__mocks__/user_mock";

describe("getByXUserToken", () => {
  it("should return a user when a valid X-User is provided", async () => {
    const validToken = Buffer.from(JSON.stringify(mockedUserIdentity)).toString('base64');

    const result = getByXUserToken(validToken);
    
    expect(result).toEqual(E.right(O.some(mockedUserIdentity)));
  });

  it("should return an error when an invalid X-User is provided", async () => {
    const invalidToken = Buffer.from(JSON.stringify({ test: "test" })).toString('base64');

    const result = getByXUserToken(invalidToken);
    
    expect(E.isLeft(result)).toBeTruthy();
  });
});
