import { ServiceId } from "@pagopa/io-functions-app-sdk/ServiceId";
import { aFiscalCode } from "../../__mocks__/user_mock";
import { checkIfLollipopIsEnabled } from "../lollipop";
import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "@pagopa/io-functions-app-sdk/FiscalCode";
import { ThirdPartyConfigList } from "../thirdPartyConfig";

const aServiceId = "aServiceId" as ServiceId;
const aLollipopEnabledFiscalCode = "ABCABC00A00B000C" as FiscalCode;
const aLollipopDisabledFiscalCode = aFiscalCode;

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
  serviceId: aServiceId,
  schemaKind: "PN",
  jsonSchema: "aJsonSchema",
  isLollipopEnabled: "true",
  disableLollipopFor: [aLollipopDisabledFiscalCode],
};

const aValidThirdPartyConfig = {
  ...aValidBaseThirdPartyConfig,
  ...aValidProdEnvironmentConfig,
  ...aValidTestEnvironmentConfig,
};

describe("checkIfLollipopIsEnabled", () => {
  it("Should return true when lollipop is enabled and the user is not in the blacklist", async () => {
    const res = await checkIfLollipopIsEnabled(
      [aValidThirdPartyConfig] as unknown as ThirdPartyConfigList,
      aLollipopEnabledFiscalCode,
      aServiceId
    )();

    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toBe(true);
    }
  });

  it("Should return false when lollipop is enabled and the user is in the blacklist", async () => {
    const res = await checkIfLollipopIsEnabled(
      [aValidThirdPartyConfig] as unknown as ThirdPartyConfigList,
      aLollipopDisabledFiscalCode,
      aServiceId
    )();

    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toBe(false);
    }
  });

  it("Should return false when lollipop is disabled and the user is not in the blacklist", async () => {
    const res = await checkIfLollipopIsEnabled(
      [
        { ...aValidThirdPartyConfig, isLollipopEnabled: false },
      ] as unknown as ThirdPartyConfigList,
      aLollipopEnabledFiscalCode,
      aServiceId
    )();

    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toBe(false);
    }
  });

  it("Should return false when lollipop is disabled and the user is in the blacklist", async () => {
    const res = await checkIfLollipopIsEnabled(
      [
        { ...aValidThirdPartyConfig, isLollipopEnabled: false },
      ] as unknown as ThirdPartyConfigList,
      aLollipopDisabledFiscalCode,
      aServiceId
    )();

    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toBe(false);
    }
  });
});
