import { DOMParser } from "xmldom";

import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";

type SpidError = string;

/**
 * Extract StatusMessage from SAML response
 *
 * ie. for <StatusMessage>ErrorCode nr22</StatusMessage>
 * returns "22"
 */
export default function getErrorCodeFromResponse(
  xml: string
): O.Option<SpidError> {
  return pipe(
    O.tryCatch(() => new DOMParser().parseFromString(xml)),
    O.chain(xmlResponse =>
      xmlResponse
        ? O.some(xmlResponse.getElementsByTagName("StatusMessage"))
        : O.none
    ),
    O.chain(responseStatusMessageEl =>
      responseStatusMessageEl?.[0]?.textContent
        ? O.some(responseStatusMessageEl[0].textContent.trim())
        : O.none
    ),
    O.chain(errorString => {
      const indexString = "ErrorCode nr";
      const errorCode = errorString.slice(
        errorString.indexOf(indexString) + indexString.length
      );
      return errorCode ? O.some(errorCode) : O.none;
    })
  );
}
