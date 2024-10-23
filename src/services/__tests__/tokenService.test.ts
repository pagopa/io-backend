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
const tokenTtl = 60 as Second;
const aTokenIssuer = "ISSUER" as NonEmptyString;

const aTokenLengthBytes = 48;
const aTokenLengthString = aTokenLengthBytes * 2; // because bytes

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
