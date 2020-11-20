import { isLeft, isRight } from "fp-ts/lib/Either";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { Second } from "italia-ts-commons/lib/units";
import TokenService from "../tokenService";

const aFiscalCode = "AAAAAAAAAAAAAAA" as FiscalCode;
const aPrivateRsaKey = `-----BEGIN RSA PRIVATE KEY-----
MIIBOgIBAAJBAPX91rBDbLk5Pr0/lf4y1a8oz75sYa+slTqpfVHUrYb22qy4rY6Z
B0rXvTeLPgCAXUfGFJu4qSJcbu7yhBrPx30CAwEAAQJBALRCvEVUU2L0IRabdvXd
GJuP45ReZcNPS9e+BhimKjcgVFmyrpmiItNBHKFyTM8uL8dHXen1ReUgZOHcPKpV
MF0CIQD8KxN+ZhrxPIMPEJJJOO/Pn4y3iZRowulkaFDFUMUzzwIhAPm6vD95LAJW
DyC2relGDbA6h/YrBg38fcr1KQgxe0bzAiAcUL30oIR/+BqDU4oJnNIYz0KezV0T
0mcgtjHzphkuswIgXbRK1IpUECBYls7VHNXTZw/fWmg0YmUeklxBZDik6C8CIBXl
niQ7qszA7Uel9+wv2DwzWj+8OUcRzJAGOVD8cy2S
-----END RSA PRIVATE KEY-----` as NonEmptyString;
const tokenTtl = 60 as Second;
const aTokenIssuer = "ISSUER" as NonEmptyString;

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

describe("TokenService#getSupportToken", () => {
  it("should generate a new support token", async () => {
    // generate new token
    const tokenService = new TokenService();
    const errorOrNewJwtToken = await tokenService
      .getJwtSupportToken(aPrivateRsaKey, aFiscalCode, tokenTtl, aTokenIssuer)
      .run();
    expect(isRight(errorOrNewJwtToken)).toBeTruthy();
  });

  it("should return an error if an error occurs during token generation", async () => {
    // generate new token
    const tokenService = new TokenService();
    const errorOrNewJwtToken = await tokenService
      .getJwtSupportToken(
        "aPrivateRsaKey" as NonEmptyString,
        aFiscalCode,
        tokenTtl,
        aTokenIssuer
      )
      .run();
    expect(isLeft(errorOrNewJwtToken)).toBeTruthy();
  });
});
