import * as E from "fp-ts/lib/Either";

import { ThirdPartyConfigListFromString } from "../thirdPartyConfig";

import { aFiscalCode } from "../../__mocks__/user_mock";

const aValidDetailAuthentication = {
  type: "API_KEY",
  header_key_name: "aParamName",
  key: "aKey",
};

const aValidTestEnvironmentConfig = {
  testEnvironment: {
    testUsers: [aFiscalCode],
    baseUrl: "anotherBaseUrl",
    detailsAuthentication: aValidDetailAuthentication,
  },
};

const aValidProdEnvironmentConfig = {
  prodEnvironment: {
    baseUrl: "aBaseUrl",
    detailsAuthentication: aValidDetailAuthentication,
  },
};

const aValidBaseThirdPartyConfig = {
  serviceId: "aServiceId",
  schemaKind: "PN",
  jsonSchema: "aJsonSchema",
  isLollipopEnabled: "true",
  disableLollipopFor: [],
};

const aValidExpectedBaseThirdPartyConfig = {
  serviceId: "aServiceId",
  schemaKind: "PN",
  jsonSchema: "aJsonSchema",
  isLollipopEnabled: true,
  disableLollipopFor: [],
};

describe("ThirdPartyConfigListFromString", () => {
  it("should decode an empty array from an empty string", async () => {
    const decoded = ThirdPartyConfigListFromString.decode("");
    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      const right = decoded.right;
      expect(right).toEqual([]);
    }
  });

  it("should decode an array with a valid PROD config", async () => {
    const aValidThirdPartyConfigString = JSON.stringify([
      {
        ...aValidBaseThirdPartyConfig,
        ...aValidProdEnvironmentConfig,
      },
    ]);

    const decoded = ThirdPartyConfigListFromString.decode(
      aValidThirdPartyConfigString
    );

    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      const right = decoded.right;
      expect(right).toEqual([
        {
          ...aValidExpectedBaseThirdPartyConfig,
          ...aValidProdEnvironmentConfig,
        },
      ]);
    }
  });

  it("should decode an array with a valid TEST config", async () => {
    const aValidThirdPartyConfigString = JSON.stringify([
      {
        ...aValidBaseThirdPartyConfig,
        ...aValidTestEnvironmentConfig,
      },
    ]);

    const decoded = ThirdPartyConfigListFromString.decode(
      aValidThirdPartyConfigString
    );
    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      const right = decoded.right;
      expect(right).toEqual([
        {
          ...aValidExpectedBaseThirdPartyConfig,
          ...aValidTestEnvironmentConfig,
        },
      ]);
    }
  });

  it("should decode an array with a valid TEST and PROD config", async () => {
    const aValidThirdPartyConfigString = JSON.stringify([
      {
        ...aValidBaseThirdPartyConfig,
        ...aValidProdEnvironmentConfig,
        ...aValidTestEnvironmentConfig,
      },
    ]);

    const decoded = ThirdPartyConfigListFromString.decode(
      aValidThirdPartyConfigString
    );
    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      const right = decoded.right;
      expect(right).toEqual([
        {
          ...aValidExpectedBaseThirdPartyConfig,
          ...aValidProdEnvironmentConfig,
          ...aValidTestEnvironmentConfig,
        },
      ]);
    }
  });

  it("should fail decoding a config with missing client_cert fields", async () => {
    const aValidThirdPartyConfigString = JSON.stringify([
      {
        ...aValidBaseThirdPartyConfig,
        prodEnvironment: {
          ...aValidProdEnvironmentConfig.prodEnvironment,
          detailsAuthentication: {
            ...aValidProdEnvironmentConfig.prodEnvironment
              .detailsAuthentication,
            cert: { client_cert: "aClientCert" },
          },
        },
      },
    ]);

    const decoded = ThirdPartyConfigListFromString.decode(
      aValidThirdPartyConfigString
    );
    expect(E.isRight(decoded)).toBeFalsy();
  });
});
