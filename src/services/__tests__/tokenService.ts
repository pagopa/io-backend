import TokenService from "../tokenService";

const aTokenLengthBytes = 48;
const aTokenLengthString = aTokenLengthBytes * 2; // because bytes

describe("tokenService#getNewToken", () => {
  it("returns a user profile from the API", async () => {
    // generate new token
    const tokenService = new TokenService();
    const newToken = tokenService.getNewToken();

    expect(newToken).toHaveLength(aTokenLengthString);
  });
});
