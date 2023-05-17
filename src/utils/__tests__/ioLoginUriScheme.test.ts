import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import {
  errorOrIoLoginURL,
  getIsUserElegibleForIoLoginUrlScheme,
} from "../ioLoginUriScheme";
import { pipe } from "fp-ts/function";
import * as E from "fp-ts/lib/Either";
import { aFiscalCode } from "../../__mocks__/user_mock";
import { FeatureFlagEnum } from "../featureFlag";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

const aValidAbsoluteURL = "https://my-personal.domain.name/";
const aValidIoLoginURL = "iologin://my-personal.domain.name/";
const aRandomPath = "p/a/t/h";
const aRandomQueryParam = "?foo=bar";
const aRandomHashParam = "#sampleRegion";

const decodingURL = (url: string) =>
  pipe(
    url,
    UrlFromString.decode,
    E.getOrElseW(() => {
      throw new Error("could not decode URL");
    })
  );

const anotherFiscalCode = "ISPXNB32R82Y766D" as FiscalCode;
const aRegexPattern = "^([(0-9)|(a-f)|(A-F)]{63}0)$";

describe("IOLOGIN utility methods testing", () => {
  it.each`
    input                                                                     | expectedResult
    ${aValidAbsoluteURL}                                                      | ${aValidIoLoginURL}
    ${aValidAbsoluteURL + aRandomPath}                                        | ${aValidIoLoginURL + aRandomPath}
    ${aValidAbsoluteURL + aRandomPath + aRandomQueryParam}                    | ${aValidIoLoginURL + aRandomPath + aRandomQueryParam}
    ${aValidAbsoluteURL + aRandomPath + aRandomQueryParam + aRandomHashParam} | ${aValidIoLoginURL + aRandomPath + aRandomQueryParam + aRandomHashParam}
  `(
    "should give $expectedResult given $input valid URL",
    ({ input, expectedResult }) => {
      const result = pipe(input, decodingURL, errorOrIoLoginURL);

      expect(result._tag).toEqual("Right");
      if (result._tag === "Right") {
        expect(result).toStrictEqual(UrlFromString.decode(expectedResult));
      }
    }
  );

  it.each`
    input                | FF                        | TEST_USERS     | expectedResult
    ${aFiscalCode}       | ${FeatureFlagEnum.NONE}   | ${""}          | ${false}
    ${aFiscalCode}       | ${FeatureFlagEnum.BETA}   | ${aFiscalCode} | ${true}
    ${anotherFiscalCode} | ${FeatureFlagEnum.BETA}   | ${aFiscalCode} | ${false}
    ${aFiscalCode}       | ${FeatureFlagEnum.CANARY} | ${""}          | ${false}
    ${anotherFiscalCode} | ${FeatureFlagEnum.CANARY} | ${""}          | ${true}
    ${anotherFiscalCode} | ${FeatureFlagEnum.ALL}    | ${""}          | ${true}
  `(
    "should give $expectedResult given FF $FF with $TEST_USERS allowed",
    ({ input, FF, TEST_USERS, expectedResult }) => {
      const isUserElegibleForIoLoginUrlScheme =
        getIsUserElegibleForIoLoginUrlScheme(TEST_USERS, aRegexPattern, FF);
      expect(isUserElegibleForIoLoginUrlScheme(input)).toEqual(expectedResult);
    }
  );
});
