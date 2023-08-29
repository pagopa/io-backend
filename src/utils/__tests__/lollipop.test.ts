import { ServiceId } from "@pagopa/io-functions-app-sdk/ServiceId";
import { aFiscalCode } from "../../__mocks__/user_mock";
import {
  checkIfLollipopIsEnabled,
  extractLollipopLocalsFromLollipopHeaders,
} from "../lollipop";
import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "@pagopa/io-functions-app-sdk/FiscalCode";
import { ThirdPartyConfigList } from "../thirdPartyConfig";
import { LollipopApiClient } from "../../clients/lollipop";
import { AssertionTypeEnum } from "../../../generated/lollipop-api/AssertionType";
import {
  anAssertionRef,
  lollipopRequiredHeaders,
  mockSessionStorage,
} from "../../__mocks__/lollipop";
import { PubKeyStatusEnum } from "../../../generated/lollipop-api/PubKeyStatus";
import { LollipopRequiredHeaders } from "../../types/lollipop";
import { pipe } from "fp-ts/lib/function";
import * as RA from "fp-ts/ReadonlyArray";

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

describe("extractLollipopLocalsFromLollipopHeaders|>missing fiscal code", () => {
  const aBearerToken = "aBearerTokenJWT";
  const aPubKey = "aPubKey";

  const mockGenerateLCParams = jest.fn().mockImplementation(async () =>
    E.right({
      status: 200,
      value: {
        fiscal_code: aFiscalCode,
        assertion_file_name: `${aFiscalCode}-${anAssertionRef}`,
        assertion_type: AssertionTypeEnum.SAML,
        expired_at: new Date(),
        lc_authentication_bearer: aBearerToken,
        assertion_ref: anAssertionRef,
        pub_key: aPubKey,
        version: 1,
        status: PubKeyStatusEnum.VALID,
        ttl: 900,
      },
    })
  );
  const mockLollipopClient: ReturnType<typeof LollipopApiClient> = {
    generateLCParams: mockGenerateLCParams,
    activatePubKey: jest.fn(),
    ping: jest.fn(),
    reservePubKey: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each`
    generateLCParamsCalls
    ${1}
    ${2}
    ${3}
  `(
    "should return the lollipop header when the assertion ref was found for the keyId",
    async ({ generateLCParamsCalls }) => {
      pipe(
        RA.replicate(generateLCParamsCalls - 1, undefined),
        RA.map(() =>
          mockGenerateLCParams.mockImplementationOnce(async () =>
            E.right({ status: 404 })
          )
        )
      );

      const res = await extractLollipopLocalsFromLollipopHeaders(
        mockLollipopClient,
        mockSessionStorage,
        lollipopRequiredHeaders as LollipopRequiredHeaders,
        undefined
      )();

      expect(mockGenerateLCParams).toHaveBeenCalledTimes(generateLCParamsCalls);
      expect(res).toMatchObject(
        E.right({
          ...lollipopRequiredHeaders,
          "x-pagopa-lollipop-assertion-ref":
            "sha256-6LvipIvFuhyorHpUqK3HjySC5Y6gshXHFBhU9EJ4DoM=",
          "x-pagopa-lollipop-assertion-type": "SAML",
          "x-pagopa-lollipop-auth-jwt": "aBearerTokenJWT",
          "x-pagopa-lollipop-public-key": "aPubKey",
          "x-pagopa-lollipop-user-id": "GRBGPP87L04L741X",
        })
      );
    }
  );

  it("should return Internal Server Error when no assertion ref was found for the keyId", async () => {
    pipe(
      RA.replicate(3, undefined),
      RA.map(() =>
        mockGenerateLCParams.mockImplementationOnce(async () =>
          E.right({ status: 404 })
        )
      )
    );

    const res = await extractLollipopLocalsFromLollipopHeaders(
      mockLollipopClient,
      mockSessionStorage,
      lollipopRequiredHeaders as LollipopRequiredHeaders,
      undefined
    )();

    expect(mockGenerateLCParams).toHaveBeenCalledTimes(3);
    expect(res).toMatchObject(
      E.left({
        detail: "Internal server error: Missing assertion ref",
        kind: "IResponseErrorInternal",
      })
    );
  });
});
