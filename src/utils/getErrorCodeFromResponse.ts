import { DOMParser } from "xmldom";

import { none, Option, some, tryCatch } from "fp-ts/lib/Option";

type SpidError = string;

/**
 * Extract StatusMessage from SAML response
 *
 * ie. for <StatusMessage>ErrorCode nr22</StatusMessage>
 * returns "22"
 */
export default function getErrorCodeFromResponse(
  xml: string
): Option<SpidError> {
  return tryCatch(() => new DOMParser().parseFromString(xml))
    .chain(xmlResponse =>
      xmlResponse
        ? some(xmlResponse.getElementsByTagName("StatusMessage"))
        : none
    )
    .chain(responseStatusMessageEl => {
      return responseStatusMessageEl &&
        responseStatusMessageEl[0] &&
        responseStatusMessageEl[0].textContent
        ? some(responseStatusMessageEl[0].textContent.trim())
        : none;
    })
    .chain(errorString => {
      const indexString = "ErrorCode nr";
      const errorCode = errorString.slice(
        errorString.indexOf(indexString) + indexString.length
      );
      return errorCode ? some(errorCode) : none;
    });
}
