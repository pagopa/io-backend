import { ValidUrl } from "@pagopa/ts-commons/lib/url";
import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";
import * as S from "fp-ts/lib/string";

export const stripTrailingSlashIfPresent = (aValidUrl: ValidUrl): string =>
  pipe(
    aValidUrl.href,
    E.fromPredicate(S.endsWith("/"), () => aValidUrl.href),
    E.map(S.slice(0, aValidUrl.href.length - 1)),
    E.fold(identity, identity)
  );
