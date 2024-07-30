import TokenService from "../../services/tokenService";
import { obfuscateTokensInfo } from "../redis";

export const SESSION_TOKEN_LENGTH_BYTES = 48;

const getAnErrorMessage = (token: string) =>
  `{"code":"UNCERTAIN_STATE","command":"MGET","args":["${token}"],"origin":{"errno":-110,"code":"ETIMEDOUT","syscall":"read"}}`;
describe("obfuscateTokensInfo", () => {
  it("should offuscate a token string", () => {
    const token = new TokenService().getNewToken(SESSION_TOKEN_LENGTH_BYTES);
    const errorMessage = getAnErrorMessage(`SESSION-${token}`);
    expect(obfuscateTokensInfo(errorMessage)).toEqual(
      getAnErrorMessage(`SESSION-redacted`)
    );
  });
});
