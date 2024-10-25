import { mockSessionToken } from "../../__mocks__/user_mock";
import { obfuscateTokensInfo } from "../redis";

export const SESSION_TOKEN_LENGTH_BYTES = 48;

const getAnErrorMessage = (token: string) =>
  `{"code":"UNCERTAIN_STATE","command":"MGET","args":["${token}"],"origin":{"errno":-110,"code":"ETIMEDOUT","syscall":"read"}}`;
describe("obfuscateTokensInfo", () => {
  it("should offuscate a token string", () => {
    const errorMessage = getAnErrorMessage(`SESSION-${mockSessionToken}`);
    expect(obfuscateTokensInfo(errorMessage)).toEqual(
      getAnErrorMessage(`SESSION-redacted`)
    );
  });
});
