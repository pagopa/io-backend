import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import * as S from "fp-ts/lib/string";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { stripTrailingSlashIfPresent } from "../url";

const aTextualUrl = "https://domain.com";

describe("stripTrailingSlashIfPresent", () => {
  it("GIVEN a ValidUrl SHOULD return a textual url without a final slash", async () => {
    const validUrl = pipe(
      UrlFromString.decode(aTextualUrl),
      E.getOrElseW(_ => {
        throw "Error";
      })
    );

    expect(S.endsWith("/")(validUrl.href)).toEqual(true);

    const textualUrlWithoutTrailingSlash = stripTrailingSlashIfPresent(
      validUrl
    );

    expect(S.endsWith("/")(textualUrlWithoutTrailingSlash)).toEqual(false);
  });
});
