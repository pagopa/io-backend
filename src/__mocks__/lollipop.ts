import { JwkPublicKey } from "@pagopa/ts-commons/lib/jwk";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { AssertionRefSha256 } from "../../generated/lollipop-api/AssertionRefSha256";
import { AssertionRefSha512 } from "../../generated/lollipop-api/AssertionRefSha512";
import * as jose from "jose";

export const anAssertionRef = "sha256-6LvipIvFuhyorHpUqK3HjySC5Y6gshXHFBhU9EJ4DoM=" as AssertionRefSha256;
export const anotherAssertionRef = "sha512-6LvipIvFuhyorHpUqK3HjySC5Y6gshXHFBhU9EJ4DoM=" as AssertionRefSha512;

export const aJwkPubKey: JwkPublicKey = {
  kty: "EC",
  crv: "secp256k1",
  x: "Q8K81dZcC4DdKl52iW7bT0ubXXm2amN835M_v5AgpSE",
  y: "lLsw82Q414zPWPluI5BmdKHK6XbFfinc8aRqbZCEv0A"
};

export const anEncodedJwkPubKey = jose.base64url.encode(
  JSON.stringify(aJwkPubKey)
) as NonEmptyString;

export const aLollipopAssertion = `<samlp:Response Destination="https://that.spid.example.org/saml2/acs/post" ID="_5e728601-9ad4-4686-b269-81d107a8194a" InResponseTo="${anotherAssertionRef}" IssueInstant="2021-02-04T15:41:59Z" Version="2.0" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
    <saml:Issuer Format="urn:oasis:names:tc:SAML:2.0:nameid-format:entity">
        http://localhost:8080
    </saml:Issuer>
</samlp:Response>` as NonEmptyString;
