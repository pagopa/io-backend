import {
  ThirdPartyConfigListFromString
} from "../thirdPartyConfig";

import * as E from "fp-ts/lib/Either";

const aValidDetailAuthentication = {
  type: "API_KEY",
  header_key_name: "aParamName",
  key: "aKey"
};

const aValidThirdPartyConfig = {
  serviceId: "aServiceId",
  baseUrl: "aBaseUrl",
  kind: "PN",
  jsonSchema: "aJsonSchema",
  detailsAuthentication: aValidDetailAuthentication
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
  it("should decode an array with a valid config", async () => {
    const aValidThirdPartyConfigString = JSON.stringify([
      aValidThirdPartyConfig
    ]);

    const decoded = ThirdPartyConfigListFromString.decode(
      aValidThirdPartyConfigString
    );
    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      const right = decoded.value;
      expect(right).toEqual([aValidThirdPartyConfig]);
    }
  });

  it("should fail decoding a config with missing client_cert fields", async () => {
    const aValidThirdPartyConfigString = JSON.stringify([
      {
        ...aValidThirdPartyConfig,
        detailsAuthentication: {
          ...aValidThirdPartyConfig.detailsAuthentication,
          cert: { client_cert: "aClientCert" }
        }
      }
    ]);

    const decoded = ThirdPartyConfigListFromString.decode(
      aValidThirdPartyConfigString
    );
    expect(E.isRight(decoded)).toBeFalsy();
  });
});
