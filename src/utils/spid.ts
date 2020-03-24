import { fromEither, fromNullable, Option, tryCatch } from "fp-ts/lib/Option";
import * as t from "io-ts";
import { UTCISODateFromString } from "italia-ts-commons/lib/dates";
import {
  IPString,
  NonEmptyString,
  PatternString
} from "italia-ts-commons/lib/strings";

const SAML_NAMESPACE = {
  ASSERTION: "urn:oasis:names:tc:SAML:2.0:assertion",
  PROTOCOL: "urn:oasis:names:tc:SAML:2.0:protocol"
};

export const getFiscalNumberFromPayload = (doc: Document): Option<string> => {
  return fromNullable(
    doc.getElementsByTagNameNS(SAML_NAMESPACE.ASSERTION, "Attribute")
  )
    .mapNullable(collection => {
      return tryCatch(() => {
        return Array.from(collection).filter(
          elem => elem.getAttribute("Name") === "fiscalNumber"
        )[0];
      });
    })
    .mapNullable(maybeElem => maybeElem.toNullable())
    .mapNullable(_ => _.textContent?.trim());
};

const getRequestIDFromPayload = (tagName: string, attrName: string) => (
  doc: Document
): Option<string> => {
  return fromNullable(
    doc.getElementsByTagNameNS(SAML_NAMESPACE.PROTOCOL, tagName).item(0)
  ).chain(element =>
    fromEither(NonEmptyString.decode(element.getAttribute(attrName)))
  );
};

export const getRequestIDFromRequest = getRequestIDFromPayload(
  "AuthnRequest",
  "ID"
);
export const getRequestIDFromResponse = getRequestIDFromPayload(
  "Response",
  "InResponseTo"
);

export const SpidBaseMsg = t.interface({
  // Timestamp of Request/Response creation
  createdAt: UTCISODateFromString,

  // Date of the SPID request / response in YYYY-MM-DD format
  createdAtDay: PatternString("^[0-9]{4}-[0-9]{2}-[0-9]{2}$"),

  // IP of the client that made a SPID login action
  ip: IPString,

  // XML payload of the SPID Request/Response
  payload: t.string,

  // Payload type: REQUEST or RESPONSE
  payloadType: t.keyof({ REQUEST: null, RESPONSE: null })
});

export type SpidBaseMsg = t.TypeOf<typeof SpidBaseMsg>;
