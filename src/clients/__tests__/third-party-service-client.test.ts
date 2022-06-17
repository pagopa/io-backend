import * as E from "fp-ts/lib/Either";

import { ServiceId } from "../../../generated/io-messages-api/ServiceId";
import { getThirdPartyServiceClientFactory } from "../third-party-service-client";
import { ThirdPartyConfig } from "../../utils/thirdPartyConfig";

import { aFiscalCode } from "../../__mocks__/user_mock";
import { pipe } from "fp-ts/lib/function";

const aValidDetailAuthentication = {
  type: "API_KEY",
  header_key_name: "aParamName",
  key: "aKey"
};

const aServiceId = "aServiceId" as ServiceId;
const aValidTestAndProdThirdPartyConfig = pipe(
  {
    serviceId: aServiceId,
    schemaKind: "PN",
    jsonSchema: "aJsonSchema",
    prodEnvironment: {
      baseUrl: "aBaseUrl",
      detailsAuthentication: aValidDetailAuthentication
    },
    testEnvironment: {
      testUsers: [aFiscalCode],
      baseUrl: "anotherBaseUrl",
      detailsAuthentication: aValidDetailAuthentication
    }
  },
  ThirdPartyConfig.decode,
  E.getOrElseW(() => {
    throw Error("Error decoding ThirdPartyConfig");
  })
);

const aConfigList = [aValidTestAndProdThirdPartyConfig];

describe("getThirdPartyServiceClientFactory", () => {
  it("should return an Error if serviceId is not present in config list", async () => {
    const factory = getThirdPartyServiceClientFactory(aConfigList);

    const res = factory("anotherServiceId" as ServiceId);

    expect(E.isLeft(res)).toBeTruthy();
  });

  it("should return a client if serviceId is present in config list", async () => {
    const factory = getThirdPartyServiceClientFactory(aConfigList);

    const res = factory("aServiceId" as ServiceId);

    expect(E.isRight(res)).toBeTruthy();
  });
});
