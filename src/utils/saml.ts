import { fromEither, fromNullable } from "fp-ts/lib/Option";
import * as t from "io-ts";
import { DOMParser } from "xmldom";

const SAMLResponse = t.type({
  SAMLResponse: t.string
});
export type SAMLResponse = t.TypeOf<typeof SAMLResponse>;

export const getSamlIssuer = (body: unknown): string => {
  return fromEither(SAMLResponse.decode(body))
    .map(_ => Buffer.from(_.SAMLResponse, "base64").toString("utf8"))
    .chain(_ => fromNullable(new DOMParser().parseFromString(_)))
    .chain(_ => fromNullable(_.getElementsByTagName("saml:Issuer").item(0)))
    .chain(_ => fromNullable(_.textContent))
    .getOrElse("UNKNOWN");
};
