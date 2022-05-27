import * as E from "fp-ts/lib/Either";

import { ThirdPartyConfigListFromString } from "../thirdPartyConfig";

import { aFiscalCode } from "../../__mocks__/user_mock";

const aValidDetailAuthentication = {
  type: "API_KEY",
  header_key_name: "aParamName",
  key: "aKey"
};

const aValidProdThirdPartyConfig = {
  type: "PROD_ENV",
  serviceId: "aServiceId",
  schemaKind: "PN",
  jsonSchema: "aJsonSchema",
  prodEndpoint: {
    baseUrl: "aBaseUrl",
    detailsAuthentication: aValidDetailAuthentication
  }
};

const aValidTestAndProdThirdPartyConfig = {
  type: "TEST_PROD_ENV",
  serviceId: "aServiceId",
  schemaKind: "PN",
  jsonSchema: "aJsonSchema",
  prodEndpoint: {
    baseUrl: "aBaseUrl",
    detailsAuthentication: aValidDetailAuthentication
  },
  testUsers: [aFiscalCode],
  testEndpoint: {
    baseUrl: "anotherBaseUrl",
    detailsAuthentication: aValidDetailAuthentication
  }
};

describe("ThirdPartyConfigListFromString", () => {
  it("should decode an empty array from an undefined string", async () => {
    const decoded = ThirdPartyConfigListFromString.decode(undefined);
    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      const right = decoded.value;
      expect(right).toEqual([]);
    }
  });
  it("should decode an empty array from an empty string", async () => {
    const decoded = ThirdPartyConfigListFromString.decode("");
    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      const right = decoded.value;
      expect(right).toEqual([]);
    }
  });

  it("should decode an array with a valid PROD config", async () => {
    const aValidThirdPartyConfigString = JSON.stringify([
      aValidProdThirdPartyConfig
    ]);

    const decoded = ThirdPartyConfigListFromString.decode(
      aValidThirdPartyConfigString
    );
    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      const right = decoded.value;
      expect(right).toEqual([aValidProdThirdPartyConfig]);
    }
  });

  it("should decode an array with a valid TEST and PROD config", async () => {
    const aValidThirdPartyConfigString = JSON.stringify([
      aValidTestAndProdThirdPartyConfig
    ]);

    const decoded = ThirdPartyConfigListFromString.decode(
      aValidThirdPartyConfigString
    );
    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      const right = decoded.value;
      expect(right).toEqual([aValidTestAndProdThirdPartyConfig]);
    }
  });

  it("should fail decoding a config with missing client_cert fields", async () => {
    const aValidThirdPartyConfigString = JSON.stringify([
      {
        ...aValidProdThirdPartyConfig,
        prodEndpoint: {
          detailsAuthentication: {
            ...aValidProdThirdPartyConfig.prodEndpoint.detailsAuthentication,
            cert: { client_cert: "aClientCert" }
          }
        }
      }
    ]);

    const decoded = ThirdPartyConfigListFromString.decode(
      aValidThirdPartyConfigString
    );
    expect(E.isRight(decoded)).toBeFalsy();
  });
});
