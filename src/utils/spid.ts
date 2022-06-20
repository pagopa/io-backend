import { QueueClient } from "@azure/storage-queue";
import { format as dateFnsFormat } from "date-fns";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as t from "io-ts";
import { UTCISODateFromString } from "@pagopa/ts-commons/lib/dates";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import {
  FiscalCode,
  IPString,
  NonEmptyString,
  PatternString
} from "@pagopa/ts-commons/lib/strings";
import { DOMParser } from "xmldom";
import { pipe } from "fp-ts/lib/function";
import { log } from "./logger";
import { base64EncodeObject } from "./messages";

const SAML_NAMESPACE = {
  ASSERTION: "urn:oasis:names:tc:SAML:2.0:assertion",
  PROTOCOL: "urn:oasis:names:tc:SAML:2.0:protocol"
};

export const getFiscalNumberFromPayload = (
  doc: Document
): O.Option<FiscalCode> =>
  pipe(
    O.fromNullable(
      doc.getElementsByTagNameNS(SAML_NAMESPACE.ASSERTION, "Attribute")
    ),
    O.chainNullableK(collection =>
      Array.from(collection).find(
        elem => elem.getAttribute("Name") === "fiscalNumber"
      )
    ),
    O.chainNullableK(_ => _.textContent?.trim().replace("TINIT-", "")),
    O.chain(_ => O.fromEither(FiscalCode.decode(_)))
  );

const getRequestIDFromPayload = (tagName: string, attrName: string) => (
  doc: Document
): O.Option<string> =>
  pipe(
    O.fromNullable(
      doc.getElementsByTagNameNS(SAML_NAMESPACE.PROTOCOL, tagName).item(0)
    ),
    O.chain(element =>
      O.fromEither(NonEmptyString.decode(element.getAttribute(attrName)))
    )
  );

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

  // XML payload of the SPID Request
  requestPayload: t.string,

  // XML payload of the SPID Response
  responsePayload: t.string,

  // SPID request id
  spidRequestId: t.union([t.undefined, t.string])
});

type SpidMsg = t.TypeOf<typeof SpidMsg>;

export const makeSpidLogCallback = (queueClient: QueueClient) => (
  sourceIp: string | null,
  requestPayload: string,
  responsePayload: string
): void => {
  const logPrefix = `SpidLogCallback`;
  E.tryCatch(
    () => {
      const responseXML = new DOMParser().parseFromString(
        responsePayload,
        "text/xml"
      );
      if (!responseXML) {
        log.error(`${logPrefix}|ERROR=Cannot parse SPID XML`);
        return;
      }

      const maybeRequestId = getRequestIDFromResponse(responseXML);
      if (O.isNone(maybeRequestId)) {
        log.error(`${logPrefix}|ERROR=Cannot get Request ID from SPID XML`);
        return;
      }
      const requestId = maybeRequestId.value;

      const maybeFiscalCode = getFiscalNumberFromPayload(responseXML);
      if (O.isNone(maybeFiscalCode)) {
        log.error(
          `${logPrefix}|ERROR=Cannot get user's fiscal Code from SPID XML`
        );
        return;
      }
      const fiscalCode = maybeFiscalCode.value;

      const errorOrSpidMsg = SpidMsg.decode({
        createdAt: new Date(),
        createdAtDay: dateFnsFormat(new Date(), "YYYY-MM-DD"),
        fiscalCode,
        ip: sourceIp as IPString,
        requestPayload,
        responsePayload,
        spidRequestId: requestId
      } as SpidMsg);

      if (E.isLeft(errorOrSpidMsg)) {
        log.error(`${logPrefix}|ERROR=Invalid format for SPID log payload`);
        log.debug(
          `${logPrefix}|ERROR_DETAILS=${readableReport(errorOrSpidMsg.left)}`
        );
        return;
      }
      const spidMsg = errorOrSpidMsg.right;

      // encode to base64 since the queue payload is an XML
      // and cannot contain markup characters
      const spidMsgBase64 = base64EncodeObject(spidMsg);

      // we don't return the promise here
      // the call follows fire & forget pattern
      queueClient.sendMessage(spidMsgBase64).catch(err => {
        log.error(`${logPrefix}|ERROR=Cannot enqueue SPID log`);
        log.debug(`${logPrefix}|ERROR_DETAILS=${err}`);
      });
    },
    err => {
      log.error(`${logPrefix}|ERROR=${err}`);
    }
  );
};
