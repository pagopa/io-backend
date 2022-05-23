import {
  ThirdPartyConfigList,
  ThirdPartyConfigListFromString
} from "../thirdPartyConfig";

import * as E from "fp-ts/lib/Either";

const aValidDetailAuthentication = {
  type: "API_KEY",
  parameterName: "aParamName",
  required: true
};

const aValidThirdPartyConfig = {
  serviceId: "aServiceId",
  baseUrl: "aBaseUrl",
  kind: "PN",
  jsonSchema: "aJsonSchema",
  detailsAuthentication: aValidDetailAuthentication
};

describe("ThirdPartyConfigList", () => {
  it("should decode an empty array", async () => {
    const decoded = ThirdPartyConfigList.decode([]);
    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      const right = decoded.value;
      expect(right).toEqual([]);
    }
  });

  it("should decode an array with a valid config", async () => {
    const decoded = ThirdPartyConfigList.decode([aValidThirdPartyConfig]);
    expect(E.isRight(decoded)).toBeTruthy();

    if (E.isRight(decoded)) {
      const right = decoded.value;
      expect(right).toEqual([aValidThirdPartyConfig]);
    }
  });

  it("should fail decoding an invalid config", async () => {
    const {
      detailsAuthentication,
      ...anInvalidConfig
    } = aValidThirdPartyConfig;

    const decoded = ThirdPartyConfigList.decode([anInvalidConfig]);
    expect(E.isRight(decoded)).toBeFalsy();
  });
});

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
});
