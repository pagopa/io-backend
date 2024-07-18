import { UrlFromString, ValidUrl } from "@pagopa/ts-commons/lib/url";
import * as E from "fp-ts/lib/Either";
import * as S from "fp-ts/lib/string";
import { pipe } from "fp-ts/function";
import { Errors } from "io-ts";

const IOLOGIN_URI_SCHEME = "iologin:";
const defaultUrlSchemeRegex = new RegExp("^http[s]?:");

export const errorOrIoLoginURL = (url: ValidUrl): E.Either<Errors, ValidUrl> =>
  pipe(
    url,
    UrlFromString.encode,
    // replace http: or https: URIschemes with iologin:
    S.replace(defaultUrlSchemeRegex, IOLOGIN_URI_SCHEME),
    UrlFromString.decode
  );
