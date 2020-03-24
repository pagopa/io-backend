import { QueueClient } from "@azure/storage-queue";
import { format as dateFnsFormat } from "date-fns";
import { isLeft } from "fp-ts/lib/Either";
import {
  fromEither,
  fromNullable,
  isNone,
  Option,
  tryCatch
} from "fp-ts/lib/Option";
import * as t from "io-ts";
import { UTCISODateFromString } from "italia-ts-commons/lib/dates";
import { readableReport } from "italia-ts-commons/lib/reporters";
import {
  FiscalCode,
  IPString,
  NonEmptyString,
  PatternString
} from "italia-ts-commons/lib/strings";
import { log } from "./logger";

const SAML_NAMESPACE = {
  ASSERTION: "urn:oasis:names:tc:SAML:2.0:assertion",
  PROTOCOL: "urn:oasis:names:tc:SAML:2.0:protocol"
};

export const getFiscalNumberFromPayload = (
  doc: Document
): Option<FiscalCode> => {
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
    .mapNullable(_ => _.textContent?.trim())
    .chain(_ => fromEither(FiscalCode.decode(_)));
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

const SpidMsg = t.interface({
  // Timestamp of Request/Response creation
  createdAt: UTCISODateFromString,

  // Date of the SPID request / response in YYYY-MM-DD format
  createdAtDay: PatternString("^[0-9]{4}-[0-9]{2}-[0-9]{2}$"),

  // Fiscal code of the authenticating user
  fiscalCode: t.union([t.undefined, FiscalCode]),

  // IP of the client that made a SPID login action
  ip: IPString,

  // XML payload of the SPID Request/Response
  payload: t.string,

  // Payload type: REQUEST or RESPONSE
  payloadType: t.keyof({ REQUEST: null, RESPONSE: null }),

  // SPID request id
  spidRequestId: t.union([t.undefined, t.string])
});

type SpidMsg = t.TypeOf<typeof SpidMsg>;

export const makeSpidLogCallback = (queueClient: QueueClient) => (
  sourceIp: string | null,
  payload: string,
  payloadType: "REQUEST" | "RESPONSE"
): void => {
  const maybeXmlPayload = tryCatch(() =>
    new DOMParser().parseFromString(payload, "text/xml")
  );
  if (isNone(maybeXmlPayload)) {
    log.error(`SpidLogCallback|ERROR=Cannot parse SPID XML Payload`);
    return;
  }

  const xmlPayload = maybeXmlPayload.value;

  const maybeRequestId =
    payloadType === "REQUEST"
      ? getRequestIDFromRequest(xmlPayload)
      : getRequestIDFromResponse(xmlPayload);

  const maybeFiscalCode = getFiscalNumberFromPayload(xmlPayload);

  if (isNone(maybeRequestId)) {
    log.error(`SpidLogCallback|ERROR=Cannot get Request ID from XML Payload`);
    return;
  }

  if (isNone(maybeFiscalCode) && payloadType === "RESPONSE") {
    log.error(
      `SpidLogCallback|ERROR=Cannot recognize fiscal Code on XML Payload provided by SAMLResponse`
    );
    return;
  }

  const errorOrSpidMsg = SpidMsg.decode({
    createdAt: new Date(),
    createdAtDay: dateFnsFormat(new Date(), "YYYY-MM-DD"),
    fiscalCode: maybeFiscalCode.toUndefined(),
    ip: sourceIp as IPString,
    payload,
    payloadType,
    spidRequestId: maybeRequestId.toUndefined()
  });

  if (isLeft(errorOrSpidMsg)) {
    log.error(`SpidLogCallback|ERROR=Invalid format for SPID log payload`);
    log.debug(
      `SpidLogCallback|ERROR_DETAILS=${readableReport(errorOrSpidMsg.value)}`
    );
    return;
  }
  const spidMsg = errorOrSpidMsg.value;

  // encode to base64 since the queue payload is an XML
  // and cannot contain markup characters
  const spidMsgBase64 = Buffer.from(JSON.stringify(spidMsg)).toString("base64");

  // we don't return the promise here
  // the call follows fire & forget pattern
  queueClient.sendMessage(spidMsgBase64).catch(err => {
    log.error(`SpidLogCallback|ERROR=Cannot enqueue SPID payload`);
    log.debug(`SpidLogCallback|ERROR_DETAILS=${err}`);
  });
};
