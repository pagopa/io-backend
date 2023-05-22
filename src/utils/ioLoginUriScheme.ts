import { UrlFromString, ValidUrl } from "@pagopa/ts-commons/lib/url";
import * as E from "fp-ts/lib/Either";
import * as S from "fp-ts/lib/string";
import { pipe } from "fp-ts/function";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { Errors } from "io-ts";
import { sha256 } from "@pagopa/io-functions-commons/dist/src/utils/crypto";
import {
  IResponseErrorInternal,
  IResponsePermanentRedirect,
  ResponseErrorInternal,
  ResponsePermanentRedirect,
} from "@pagopa/ts-commons/lib/responses";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { FeatureFlag, getIsUserEligibleForNewFeature } from "./featureFlag";

const IOLOGIN_URI_SCHEME = "iologin:";
const defaultUrlSchemeRegex = new RegExp("^http[s]?:");

export const getIsUserElegibleForIoLoginUrlScheme = (
  betaTesters: ReadonlyArray<FiscalCode>,
  regexPattern: string,
  FF: FeatureFlag
) =>
  getIsUserEligibleForNewFeature<FiscalCode>(
    (fiscalCode) => betaTesters.includes(fiscalCode),
    (fiscalCode) => {
      const regex = new RegExp(regexPattern);
      // below the bind is needed to keep reference to "this" object
      return pipe(fiscalCode, sha256, regex.test.bind(regex));
    },
    FF
  );

export const errorOrIoLoginURL = (url: ValidUrl): E.Either<Errors, ValidUrl> =>
  pipe(
    url,
    UrlFromString.encode,
    // replace http: or https: URIschemes with iologin:
    S.replace(defaultUrlSchemeRegex, IOLOGIN_URI_SCHEME),
    UrlFromString.decode
  );

export const internalErrorOrIoLoginRedirect = (
  redirectionUrl: ValidUrl
): E.Either<IResponseErrorInternal, IResponsePermanentRedirect> =>
  pipe(
    redirectionUrl,
    errorOrIoLoginURL,
    // this should never happen, but we manage the either anyway
    E.mapLeft((errors) =>
      ResponseErrorInternal(`Invalid url | ${readableReportSimplified(errors)}`)
    ),
    E.map(ResponsePermanentRedirect)
  );
