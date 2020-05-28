import TokenService from "../tokenService";

const aTokenLengthBytes = 48;
const aTokenLengthString = aTokenLengthBytes * 2; // because bytes

describe("TokenService#getNewToken", () => {
  it("generate a new token", () => {
    // generate new token
    const tokenService = new TokenService();
    const newToken = tokenService.getNewToken(aTokenLengthBytes);

    expect(newToken).toHaveLength(aTokenLengthString);
  });
});

describe("TokenService#getNewTokenAsync", () => {
  it("generate a new token", async () => {
    // generate new token
    const tokenService = new TokenService();
    const newToken = await tokenService.getNewTokenAsync(aTokenLengthBytes);

    expect(newToken).toHaveLength(aTokenLengthString);
  });
});
