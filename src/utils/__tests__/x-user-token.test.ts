import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { getByXUserToken } from "../x-user-token";
import { mockedUserIdentity } from "../../__mocks__/user_mock";

// Mock the config module
jest.mock("../../config", () => ({
  FF_IO_X_USER_TOKEN_ENABLED: ["GRBGPP87L04L741X"]
}));

describe("getByXUserToken", () => {
  it("should return a user when a valid X-User is provided", async () => {
    const validToken = Buffer.from(JSON.stringify({ ...mockedUserIdentity, fiscal_code: "GRBGPP87L04L741X" })).toString('base64');

    const result = getByXUserToken(validToken);
    
    expect(result).toEqual(E.right(O.some({ ...mockedUserIdentity, fiscal_code: "GRBGPP87L04L741X" })));
  });

  it("should return O.none when an invalid X-User is provided", async () => {
    const invalidToken = Buffer.from(JSON.stringify({ ...mockedUserIdentity, fiscal_code: "GRBGPP87L04L741Z" })).toString('base64');

    const result = getByXUserToken(invalidToken);
    
    expect(result).toEqual(E.right(O.none));
  });
});
