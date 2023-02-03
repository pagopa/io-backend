import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import { ServiceId } from "../../../generated/io-messages-api/ServiceId";
import { getThirdPartyServiceClientFactory } from "../third-party-service-client";
import { ThirdPartyConfig } from "../../utils/thirdPartyConfig";

import { getThirdPartyServiceClient } from "../third-party-service-client";

import { aFiscalCode } from "../../__mocks__/user_mock";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import {
  aPnThirdPartyMessage,
  aPNServiceId,
  aPNThirdPartyNotification,
  base64File
} from "../../__mocks__/pn";

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
      baseUrl: "http://aBaseUrl",
      detailsAuthentication: aValidDetailAuthentication
    },
    testEnvironment: {
      testUsers: [aFiscalCode],
      baseUrl: "http://anotherBaseUrl",
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

const mockNodeFetch = jest.fn();
mockNodeFetch.mockImplementation(
  async (_input: RequestInfo | URL, _init?: RequestInit) =>
    ({
      ok: true,
      status: 200,
      json: async () => {
        return aPnThirdPartyMessage;
      }
    } as Response)
);

const aThirdPartyId = "aThirdPartyId";

describe("third-party-service-client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should add ApiKey header to Third Party service call with API_KEY configuration when user is a TEST user", async () => {
    const client = getThirdPartyServiceClient(
      aValidTestAndProdThirdPartyConfig,
      mockNodeFetch
    )(aFiscalCode);

    client.getThirdPartyMessageDetails({
      id: aThirdPartyId
    });
    const expectedConfig = aValidTestAndProdThirdPartyConfig.testEnvironment!;

    expect(mockNodeFetch).toHaveBeenCalledWith(
      `${expectedConfig.baseUrl}/messages/${aThirdPartyId}`,
      {
        headers: {
          fiscal_code: aFiscalCode,
          [expectedConfig.detailsAuthentication.header_key_name]:
            expectedConfig.detailsAuthentication.key
        },
        method: "get",
        redirect: "manual"
      }
    );
  });

  it("should add ApiKey header to Third Party service call with API_KEY configuration when user is a PROD user", async () => {
    const aProdFiscalCode = "GRBRPP87L04L741X" as FiscalCode;

    const client = getThirdPartyServiceClient(
      aValidTestAndProdThirdPartyConfig,
      mockNodeFetch
    )(aProdFiscalCode);

    client.getThirdPartyMessageDetails({
      id: aThirdPartyId
    });
    const expectedConfig = aValidTestAndProdThirdPartyConfig.prodEnvironment!;

    expect(mockNodeFetch).toHaveBeenCalledWith(
      `${expectedConfig.baseUrl}/messages/${aThirdPartyId}`,
      {
        headers: {
          fiscal_code: aProdFiscalCode,
          [expectedConfig.detailsAuthentication.header_key_name]:
            expectedConfig.detailsAuthentication.key
        },
        method: "get",
        redirect: "manual"
      }
    );
  });

  it("should handle fetch for PN service with adapter data (get detail)", async () => {
    const aProdFiscalCode = "GRBRPP87L04L741X" as FiscalCode;

    const client = getThirdPartyServiceClient(
      { ...aValidTestAndProdThirdPartyConfig, serviceId: aPNServiceId },
      mockNodeFetch
    )(aProdFiscalCode);

    const res = await client.getThirdPartyMessageDetails({
      id: aThirdPartyId
    });
    const expectedConfig = aValidTestAndProdThirdPartyConfig.prodEnvironment!;

    expect(res).toMatchObject(
      E.right({
        status: 200,
        value: aPNThirdPartyNotification
      })
    );

    expect(mockNodeFetch).toHaveBeenCalledWith(
      `${expectedConfig.baseUrl}/delivery/notifications/received/${aThirdPartyId}`,
      {
        headers: {
          Accept: "application/io+json",
          "x-pagopa-cx-taxid": aProdFiscalCode,
          "x-api-key": "aKey",
          [expectedConfig.detailsAuthentication.header_key_name]:
            expectedConfig.detailsAuthentication.key
        },
        method: "get",
        redirect: "manual"
      }
    );
  });

  it("should call custom decoder when getThirdPartyMessageAttachment is called", async () => {
    var buffer = Buffer.from(base64File);
    var arrayBuffer = new Uint8Array(buffer).buffer;

    mockNodeFetch.mockImplementationOnce(
      async (_input: RequestInfo | URL, _init?: RequestInit) => {
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => arrayBuffer
        } as Response;
      }
    );

    const aProdFiscalCode = "GRBRPP87L04L741X" as FiscalCode;

    const client = getThirdPartyServiceClient(
      { ...aValidTestAndProdThirdPartyConfig, serviceId: aServiceId },
      mockNodeFetch
    )(aProdFiscalCode);

    const res = await client.getThirdPartyMessageAttachment({
      id: aThirdPartyId,
      attachment_url: "an/url"
    });
    const expectedConfig = aValidTestAndProdThirdPartyConfig.prodEnvironment!;

    expect(res).toMatchObject(
      E.right({
        status: 200,
        value: buffer
      })
    );

    expect(mockNodeFetch).toHaveBeenCalledWith(
      `${expectedConfig.baseUrl}/messages/${aThirdPartyId}/an/url`,
      {
        headers: {
          fiscal_code: aProdFiscalCode,
          [expectedConfig.detailsAuthentication.header_key_name]:
            expectedConfig.detailsAuthentication.key
        },
        method: "get",
        redirect: "manual"
      }
    );
  });

  it("should handle fetch for PN service with adapter data (get attachment)", async () => {
    const aProdFiscalCode = "GRBRPP87L04L741X" as FiscalCode;

    const client = getThirdPartyServiceClient(
      { ...aValidTestAndProdThirdPartyConfig, serviceId: aPNServiceId },
      mockNodeFetch
    )(aProdFiscalCode);

    await client.getThirdPartyMessageAttachment({
      id: aThirdPartyId,
      attachment_url: `delivery/notifications/sent/${aThirdPartyId}/attachments/documents/0`
    });
    const expectedConfig = aValidTestAndProdThirdPartyConfig.prodEnvironment!;

    expect(mockNodeFetch).toHaveBeenCalledWith(
      `${expectedConfig.baseUrl}/delivery/notifications/sent/${aThirdPartyId}/attachments/documents/0`,
      {
        headers: {
          "x-pagopa-cx-taxid": aProdFiscalCode,
          "x-api-key": "aKey",
          [expectedConfig.detailsAuthentication.header_key_name]:
            expectedConfig.detailsAuthentication.key
        },
        method: "get",
        redirect: "manual"
      }
    );
  });
});
