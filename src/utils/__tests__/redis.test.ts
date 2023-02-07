import TokenService from "../../services/tokenService";
import { SESSION_TOKEN_LENGTH_BYTES } from "../../controllers/authenticationController";
import { obfuscateTokensInfo } from "../redis";

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
