import { JwkPublicKey } from "@pagopa/ts-commons/lib/jwk";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { AssertionRefSha256 } from "../../generated/lollipop-api/AssertionRefSha256";
import { AssertionRefSha512 } from "../../generated/lollipop-api/AssertionRefSha512";
import * as jose from "jose";
import { LollipopSignature } from "../../generated/lollipop/LollipopSignature";
import { LollipopSignatureInput } from "../../generated/lollipop/LollipopSignatureInput";
import { LollipopMethod } from "../../generated/lollipop/LollipopMethod";
import { LollipopOriginalURL } from "../../generated/lollipop/LollipopOriginalURL";
import { LollipopLocalsType, Thumbprint } from "../types/lollipop";
import { AssertionTypeEnum } from "../../generated/io-sign-api/AssertionType";
import { LollipopJWTAuthorization } from "../../generated/io-sign-api/LollipopJWTAuthorization";
import { LollipopPublicKey } from "../../generated/io-sign-api/LollipopPublicKey";
import { aFiscalCode } from "./user_mock";
import { LollipopApiClient } from "../clients/lollipop";
import { ISessionStorage } from "../services/ISessionStorage";
import { LoginTypeEnum } from "../utils/fastLogin";

import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { getASAMLResponse } from "../utils/__mocks__/spid";
import { SpidLevelEnum } from "../../generated/backend/SpidLevel";

export const anAssertionRef =
  "sha256-6LvipIvFuhyorHpUqK3HjySC5Y6gshXHFBhU9EJ4DoM=" as AssertionRefSha256;
export const aThumbprint =
  "6LvipIvFuhyorHpUqK3HjySC5Y6gshXHFBhU9EJ4DoM=" as Thumbprint;
export const anotherAssertionRef =
  "sha512-Dj51I0q8aPQ3ioaz9LMqGYujAYRbDNblAQbodDRXAMxmY6hsHqEl3F6SvhfJj5oPhcqdX1ldsgEvfMNXGUXBIw==" as AssertionRefSha512;

export const lollipopData = {
  assertionRef: anotherAssertionRef,
  loginType: LoginTypeEnum.LEGACY,
};

export const aJwkPubKey: JwkPublicKey = {
  kty: "EC",
  crv: "secp256k1",
  x: "Q8K81dZcC4DdKl52iW7bT0ubXXm2amN835M_v5AgpSE",
  y: "lLsw82Q414zPWPluI5BmdKHK6XbFfinc8aRqbZCEv0A",
};

export const anEncodedJwkPubKey = jose.base64url.encode(
  JSON.stringify(aJwkPubKey)
) as NonEmptyString;

export const aLollipopAssertion = getASAMLResponse(
  aFiscalCode,
  anotherAssertionRef as any
) as NonEmptyString;
export const aSpidL3LollipopAssertion = getASAMLResponse(
  aFiscalCode,
  anotherAssertionRef as any,
  SpidLevelEnum["https://www.spid.gov.it/SpidL3"]
) as NonEmptyString;

export const aSignature =
  `sig1=:hNojB+wWw4A7SYF3qK1S01Y4UP5i2JZFYa2WOlMB4Np5iWmJSO0bDe2hrYRbcIWqVAFjuuCBRsB7lYQJkzbb6g==:` as LollipopSignature;
export const aSignatureInput =
  `sig1=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url"); created=1618884475; keyid="${aThumbprint}"` as LollipopSignatureInput;
export const aLollipopOriginalMethod = "POST" as LollipopMethod;
export const aLollipopOriginalUrl =
  "https://api.pagopa.it" as LollipopOriginalURL;

export const anInvalidSignatureInput =
  `sig1=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url"); created=1618884475; keyid="#an-invalid-thumbprint#"` as LollipopSignatureInput;

export const mockActivatePubKey = jest.fn();

export const mockLollipopApiClient = {
  ping: jest.fn(),
  activatePubKey: mockActivatePubKey,
  generateLCParams: jest.fn(),
  reservePubKey: jest.fn(),
} as ReturnType<LollipopApiClient>;

const mockGetlollipopAssertionRefForUser = jest
  .fn()
  .mockImplementation(async () => {
    return E.right(O.some(anAssertionRef));
  });

export const mockSessionStorage = {
  getLollipopAssertionRefForUser: mockGetlollipopAssertionRefForUser,
} as unknown as ISessionStorage;

export const lollipopRequiredHeaders = {
  signature:
    "sig1=:hNojB+wWw4A7SYF3qK1S01Y4UP5i2JZFYa2WOlMB4Np5iWmJSO0bDe2hrYRbcIWqVAFjuuCBRsB7lYQJkzbb6g==:",
  "signature-input": `sig1=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url"); created=1618884475; keyid="${aThumbprint}"`,
  "x-pagopa-lollipop-original-method": "POST",
  "x-pagopa-lollipop-original-url": "https://api.pagopa.it",
};

export const lollipopParams: LollipopLocalsType = {
  signature: aSignature,
  "signature-input": aSignatureInput,
  "x-pagopa-lollipop-original-method": aLollipopOriginalMethod,
  "x-pagopa-lollipop-original-url": aLollipopOriginalUrl,
  "x-pagopa-lollipop-assertion-ref": anAssertionRef,
  "x-pagopa-lollipop-assertion-type": AssertionTypeEnum.SAML,
  "x-pagopa-lollipop-auth-jwt": "a bearer token" as LollipopJWTAuthorization,
  "x-pagopa-lollipop-public-key": "a pub key" as LollipopPublicKey,
  "x-pagopa-lollipop-user-id": aFiscalCode,
};
