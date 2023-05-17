import { UrlFromString, ValidUrl } from "@pagopa/ts-commons/lib/url";
import * as E from "fp-ts/lib/Either";
import * as S from "fp-ts/lib/string";
import { pipe } from "fp-ts/function";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { getIsUserEligibleForNewFeature } from "./featureFlag";
import {
  FF_IOLOGIN,
  IOLOGIN_CANARY_USERS_SHA_REGEX,
  IOLOGIN_USERS_LIST,
} from "../config";
import { Errors } from "io-ts";
import { sha256 } from "@pagopa/io-functions-commons/dist/src/utils/crypto";

const IOLOGIN_URI_SCHEME = "iologin:";
const defaultUrlSchemeRegex = new RegExp("^http[s]?:");

export const isUserElegibleForIoLoginUrlScheme =
  getIsUserEligibleForNewFeature<FiscalCode>(
    (fiscalCode) => IOLOGIN_USERS_LIST.includes(fiscalCode),
    (fiscalCode) =>
      pipe(fiscalCode, sha256, new RegExp(IOLOGIN_CANARY_USERS_SHA_REGEX).test),
    FF_IOLOGIN
  );

export const errorOrIoLoginURL = (url: ValidUrl): E.Either<Errors, ValidUrl> =>
  pipe(
    url,
    UrlFromString.encode,
    // replace http: or https: URIschemes with iologin:
    S.replace(defaultUrlSchemeRegex, IOLOGIN_URI_SCHEME),
    UrlFromString.decode
  );
