import { QueueClient } from "@azure/storage-queue";
import { format as dateFnsFormat } from "date-fns";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as t from "io-ts";
import * as S from "fp-ts/lib/string";
import * as A from "fp-ts/lib/Array";
import { UTCISODateFromString } from "@pagopa/ts-commons/lib/dates";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import {
  FiscalCode,
  IPString,
  NonEmptyString,
  PatternString,
} from "@pagopa/ts-commons/lib/strings";
import { DOMParser } from "xmldom";
import { flow, pipe } from "fp-ts/lib/function";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import { SpidLevel, SpidLevelEnum } from "../../generated/backend/SpidLevel";
import { UserWithoutTokens } from "../types/user";
import { EmailAddress } from "../../generated/backend/EmailAddress";
import { base64EncodeObject } from "./messages";
import { log } from "./logger";
import { formatDate } from "./date";
import { AdditionalLoginPropsT, LoginType, LoginTypeEnum } from "./fastLogin";

const SAML_NAMESPACE = {
  ASSERTION: "urn:oasis:names:tc:SAML:2.0:assertion",
  PROTOCOL: "urn:oasis:names:tc:SAML:2.0:protocol",
};

export const getIssuerFromSAMLResponse: (
  doc: Document
) => O.Option<NonEmptyString> = flow(
  (doc) =>
    doc.getElementsByTagNameNS(SAML_NAMESPACE.ASSERTION, "Issuer").item(0),
  O.fromNullable,
  O.chainNullableK((element) => element.textContent?.trim()),
  O.chain((value) => O.fromEither(NonEmptyString.decode(value)))
);

export const getSpidLevelFromSAMLResponse: (
  doc: Document
) => O.Option<SpidLevelEnum> = flow(
  (doc) =>
    doc
      .getElementsByTagNameNS(SAML_NAMESPACE.ASSERTION, "AuthnContextClassRef")
      .item(0),
  O.fromNullable,
  O.chainNullableK((element) => element.textContent?.trim()),
  O.chain((value) => O.fromEither(SpidLevel.decode(value)))
);

export const getUserAttributeFromAssertion =
  (attrName: string) =>
  (SAMLResponse: Document): O.Option<NonEmptyString> =>
    pipe(
      Array.from(
        SAMLResponse.getElementsByTagNameNS(
          SAML_NAMESPACE.ASSERTION,
          "Attribute"
        )
      ),
      A.findFirst((element) => element.getAttribute("Name") === attrName),
      O.chainNullableK((element) => element.textContent?.trim()),
      O.chain((value) => O.fromEither(NonEmptyString.decode(value)))
    );

export const getFiscalNumberFromPayload: (
  doc: Document
) => O.Option<FiscalCode> = flow(
  getUserAttributeFromAssertion("fiscalNumber"),
  O.map(S.toUpperCase),
  O.map((fiscalCode) =>
    // Remove the international prefix from fiscal code.
    fiscalCode.replace("TINIT-", "")
  ),
  O.chain((nationalFiscalCode) =>
    O.fromEither(FiscalCode.decode(nationalFiscalCode))
  )
);

export const getDateOfBirthFromAssertion: (
  doc: Document
) => O.Option<NonEmptyString> = getUserAttributeFromAssertion("dateOfBirth");

export const getFamilyNameFromAssertion: (
  doc: Document
) => O.Option<NonEmptyString> = getUserAttributeFromAssertion("familyName");

export const getNameFromAssertion: (doc: Document) => O.Option<NonEmptyString> =
  getUserAttributeFromAssertion("name");

export const getSpidEmailFromAssertion: (
  doc: Document
) => O.Option<EmailAddress> = flow(
  getUserAttributeFromAssertion("email"),
  O.chain((value) => O.fromEither(EmailAddress.decode(value)))
);

export const makeProxyUserFromSAMLResponse = (
  doc: Document
): t.Validation<UserWithoutTokens> => {
  const proxyUserProperties = {
    created_at: new Date().getTime(),
    date_of_birth: pipe(
      getDateOfBirthFromAssertion(doc),
      O.map(formatDate),
      O.toUndefined
    ),
    family_name: pipe(getFamilyNameFromAssertion(doc), O.toUndefined),
    fiscal_code: pipe(getFiscalNumberFromPayload(doc), O.toUndefined),
    name: pipe(getNameFromAssertion(doc), O.toUndefined),
    spid_email: pipe(getSpidEmailFromAssertion(doc), O.toUndefined),
    spid_idp: pipe(getIssuerFromSAMLResponse(doc), O.toUndefined),
    spid_level: pipe(
      getSpidLevelFromSAMLResponse(doc),
      O.getOrElse(() => SpidLevelEnum["https://www.spid.gov.it/SpidL2"])
    ),
  };
  return pipe(proxyUserProperties, UserWithoutTokens.decode);
};

const getRequestIDFromPayload =
  (tagName: string, attrName: string) =>
  (doc: Document): O.Option<string> =>
    pipe(
      O.fromNullable(
        doc.getElementsByTagNameNS(SAML_NAMESPACE.PROTOCOL, tagName).item(0)
      ),
      O.chain((element) =>
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

  // Type of login
  loginType: withDefault(LoginType, LoginTypeEnum.LEGACY),

  // XML payload of the SPID Request
  requestPayload: t.string,

  // XML payload of the SPID Response
  responsePayload: t.string,

  // SPID request id
  spidRequestId: t.union([t.undefined, t.string]),
});

type SpidMsg = t.TypeOf<typeof SpidMsg>;

export const makeSpidLogCallback =
  (
    queueClient: QueueClient,
    getLoginType: (
      fiscalCode: FiscalCode,
      loginType?: LoginTypeEnum
    ) => LoginTypeEnum
  ) =>
  (
    sourceIp: string | null,
    requestPayload: string,
    responsePayload: string,
    additionalProps?: AdditionalLoginPropsT
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
          loginType: getLoginType(fiscalCode, additionalProps?.loginType),
          requestPayload,
          responsePayload,
          spidRequestId: requestId,
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
        queueClient.sendMessage(spidMsgBase64).catch((err) => {
          log.error(`${logPrefix}|ERROR=Cannot enqueue SPID log`);
          log.debug(`${logPrefix}|ERROR_DETAILS=${err}`);
        });
      },
      (err) => {
        log.error(`${logPrefix}|ERROR=${err}`);
      }
    );
  };
