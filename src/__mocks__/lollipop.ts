import { JwkPublicKey } from "@pagopa/ts-commons/lib/jwk";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { AssertionRefSha256 } from "../../generated/lollipop-api/AssertionRefSha256";
import { AssertionRefSha512 } from "../../generated/lollipop-api/AssertionRefSha512";
import * as jose from "jose";
import { LollipopSignature } from "../../generated/lollipop/LollipopSignature";
import { LollipopSignatureInput } from "../../generated/lollipop/LollipopSignatureInput";
import { LollipopMethod } from "../../generated/lollipop/LollipopMethod";
import { LollipopOriginalURL } from "../../generated/lollipop/LollipopOriginalURL";
import { LollipopLocalsType } from "../types/lollipop";
import { AssertionTypeEnum } from "../../generated/io-sign-api/AssertionType";
import { LollipopJWTAuthorization } from "../../generated/io-sign-api/LollipopJWTAuthorization";
import { LollipopPublicKey } from "../../generated/io-sign-api/LollipopPublicKey";
import { aFiscalCode } from "./user_mock";

export const anAssertionRef =
  "sha256-6LvipIvFuhyorHpUqK3HjySC5Y6gshXHFBhU9EJ4DoM=" as AssertionRefSha256;
export const anotherAssertionRef =
  "sha512-6LvipIvFuhyorHpUqK3HjySC5Y6gshXHFBhU9EJ4DoM=" as AssertionRefSha512;

export const aJwkPubKey: JwkPublicKey = {
  kty: "EC",
  crv: "secp256k1",
  x: "Q8K81dZcC4DdKl52iW7bT0ubXXm2amN835M_v5AgpSE",
  y: "lLsw82Q414zPWPluI5BmdKHK6XbFfinc8aRqbZCEv0A",
};

export const anEncodedJwkPubKey = jose.base64url.encode(
  JSON.stringify(aJwkPubKey)
) as NonEmptyString;

export const aLollipopAssertion =
  `<samlp:Response Destination="https://that.spid.example.org/saml2/acs/post" ID="_5e728601-9ad4-4686-b269-81d107a8194a" InResponseTo="${anotherAssertionRef}" IssueInstant="2021-02-04T15:41:59Z" Version="2.0" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
    <saml:Issuer Format="urn:oasis:names:tc:SAML:2.0:nameid-format:entity">
        http://localhost:8080
    </saml:Issuer>
</samlp:Response>` as NonEmptyString;

export const aSignature =
  `sig1=:hNojB+wWw4A7SYF3qK1S01Y4UP5i2JZFYa2WOlMB4Np5iWmJSO0bDe2hrYRbcIWqVAFjuuCBRsB7lYQJkzbb6g==:` as LollipopSignature;
export const aSignatureInput =
  `sig1=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url"); created=1618884475; keyid="test-key-rsa-pss"` as LollipopSignatureInput;
export const aLollipopOriginalMethod = "POST" as LollipopMethod;
export const aLollipopOriginalUrl =
  "https://api.pagopa.it" as LollipopOriginalURL;

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
