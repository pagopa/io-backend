import * as E from "fp-ts/Either"
import {
  EmailString,
  FiscalCode,
  NonEmptyString
} from "@pagopa/ts-commons/lib/strings";
import { Second } from "@pagopa/ts-commons/lib/units";
import TokenService from "../tokenService";
import { pipe } from "fp-ts/lib/function";

const aFirstname = "Mario" as NonEmptyString;
const aLastname = "Rossi" as NonEmptyString;
const aFiscalCode = "AAAAAAAAAAAAAAA" as FiscalCode;
const anEmailAddress = "mario.rossi@test.it" as EmailString;
const aSharedSecret = "ASHAREDSECRET123" as NonEmptyString;
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

const mitVoucher_privateKey_mock = `-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIPNKa/mrzj3DHOJiNn6pCY4xpn3VC+8yHbWbM7uuTfGuoAoGCCqGSM49\nAwEHoUQDQgAEC1bQKO9dKObwgKAGv97QMLR9w6IOFIlBGZx7PY0yE+z18xYdKZp/\nC547dDoYKjllfxMTIO0bKfHKPj2bxMiXSQ==\n-----END EC PRIVATE KEY-----` as NonEmptyString;
const mitVoucher_audience_mock = "69b3d5a9c935fac3d60c" as NonEmptyString;
const mitVoucher_tokenIssuer_mock = "app-backend.io.italia.it" as NonEmptyString;

const aPecServerSecretCode = "dummy-code" as NonEmptyString;
const aPecServerJwt =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50IjoiQUFBQUFBQUFBQUFBQUFBIn0.--ycAy9bJ9SYmTJs0TEU0fgLNk9PNCzhkucKUcg0gso";

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
    const errorOrNewJwtToken = await tokenService.getJwtSupportToken(
      aPrivateRsaKey,
      aFiscalCode,
      tokenTtl,
      aTokenIssuer
    )();
    expect(E.isRight(errorOrNewJwtToken)).toBeTruthy();
  });

  it("should return an error if an error occurs during token generation", async () => {
    // generate new token
    const tokenService = new TokenService();
    const errorOrNewJwtToken = await tokenService.getJwtSupportToken(
      "aPrivateRsaKey" as NonEmptyString,
      aFiscalCode,
      tokenTtl,
      aTokenIssuer
    )();
    expect(E.isLeft(errorOrNewJwtToken)).toBeTruthy();
  });
});

describe("TokenService#getJwtMitVoucherToken", () => {
  it("should generate a token for mit voucher", async () => {
    // generate new token
    const tokenService = new TokenService();
    const mitVoucherToken = await tokenService.getJwtMitVoucherToken(
      mitVoucher_privateKey_mock,
      aFiscalCode,
      600 as Second,
      mitVoucher_tokenIssuer_mock,
      mitVoucher_audience_mock
    )();

    expect(E.isRight(mitVoucherToken)).toBeTruthy();
  });

  it("should return an error if an error occurs during token generation", async () => {
    // generate new token
    const tokenService = new TokenService();
    const mitVoucherToken = await tokenService.getJwtMitVoucherToken(
      "aPrivateEcFakeKey" as NonEmptyString,
      aFiscalCode,
      600 as Second,
      mitVoucher_tokenIssuer_mock,
      mitVoucher_audience_mock
    )();

    expect(E.isLeft(mitVoucherToken)).toBeTruthy();
  });
});

describe("TokenService#getZendeskSupportToken", () => {
  it("should generate a new zendesk support token", async () => {
    // generate new token
    const tokenService = new TokenService();
    const errorOrNewJwtToken = await tokenService
      .getJwtZendeskSupportToken(
        aSharedSecret,
        aFirstname,
        aLastname,
        aFiscalCode,
        anEmailAddress,
        tokenTtl,
        aTokenIssuer
      )();
    expect(E.isRight(errorOrNewJwtToken)).toBeTruthy();
  });

  it("should return an error if an error occurs during token generation", async () => {
    // generate new token
    const tokenService = new TokenService();
    const errorOrNewJwtToken = await tokenService
      .getJwtZendeskSupportToken(
        "" as NonEmptyString,
        aFirstname,
        aLastname,
        aFiscalCode,
        anEmailAddress,
        tokenTtl,
        aTokenIssuer
      )();
    expect(E.isLeft(errorOrNewJwtToken)).toBeTruthy();
  });
});

describe("TokenService#getPecServerTokenHandler", () => {
  it("should generate a jwt token for Pec Server", async () => {
    const tokenService = new TokenService();
    const pecServerJwt = await tokenService
      .getPecServerTokenHandler(aFiscalCode)({
        secret: aPecServerSecretCode
      } as any)();

    expect(E.isRight(pecServerJwt)).toBeTruthy();
    expect(pipe(pecServerJwt, E.getOrElse(()=>""))).toBe(aPecServerJwt);
  });

  it("should return an error if an error occurs during token generation", async () => {
    const tokenService = new TokenService();
    const pecServerJwt = await tokenService
      .getPecServerTokenHandler(aFiscalCode)({ secret: "" } as any)();

    expect(E.isLeft(pecServerJwt)).toBeTruthy();
  });
});
