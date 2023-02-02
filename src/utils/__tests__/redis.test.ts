import TokenService from "../../services/tokenService";
import { SESSION_TOKEN_LENGTH_BYTES } from "../../controllers/authenticationController";
import { offuscateTokensInfo } from "../redis";

const getAnErrorMessage = (token: string) =>
  `{"code":"UNCERTAIN_STATE","command":"MGET","args":["${token}"],"origin":{"errno":-110,"code":"ETIMEDOUT","syscall":"read"}}`;
describe("offuscateTokensInfo", () => {
  it("should offuscate a token string", () => {
    const token = new TokenService().getNewToken(SESSION_TOKEN_LENGTH_BYTES);
    const errorMessage = getAnErrorMessage(`SESSION-${token}`);
    expect(offuscateTokensInfo(errorMessage)).toEqual(
      getAnErrorMessage(`SESSION-redacted`)
    );
  });
});
