import * as E from "fp-ts/lib/Either";

import { getThirdPartyServiceClient } from "../third-party-service-client";

import { aFiscalCode } from "../../__mocks__/user_mock";
import { FiscalCode, Ulid } from "@pagopa/ts-commons/lib/strings";
import {
  aPnThirdPartyMessage,
  aPNThirdPartyNotification,
  base64File,
  aPNConfigurationId
} from "../../__mocks__/pn";
import { lollipopParams } from "../../__mocks__/lollipop";
import { aRemoteContentConfigurationWithBothEnv } from "../../__mocks__/remote-configuration";

/*const aValidTestAndProdThirdPartyConfig = pipe(
  {
    serviceId: aServiceId,
    schemaKind: "PN",
    jsonSchema: "aJsonSchema",
    isLollipopEnabled: "false",
    disableLollipopFor: [],
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
);*/

const mockNodeFetch = jest.fn();
mockNodeFetch.mockImplementation(
  async (_input: RequestInfo | URL, _init?: RequestInit) => {
    return {
      ok: true,
      status: 200,
      json: async () => aPnThirdPartyMessage
    } as Response;
  }
);

const aConfigurationId = "01HMRBX079WB6SGYBQP1A7FSKH" as Ulid;
const aThirdPartyId = "aThirdPartyId";

describe("third-party-service-client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should add ApiKey header to Third Party service call with API_KEY configuration when user is a TEST user", async () => {
    const client = getThirdPartyServiceClient(
      aRemoteContentConfigurationWithBothEnv,
      mockNodeFetch,
      lollipopParams
    )(aFiscalCode);

    client.getThirdPartyMessageDetails({
      id: aThirdPartyId,
      ...lollipopParams
    });
    const expectedConfig = aRemoteContentConfigurationWithBothEnv.test_environment!;

    expect(mockNodeFetch).toHaveBeenCalledWith(
      `${expectedConfig.base_url}/messages/${aThirdPartyId}`,
      {
        headers: {
          fiscal_code: aFiscalCode,
          [expectedConfig.details_authentication.header_key_name]:
            expectedConfig.details_authentication.key,
          ...lollipopParams
        },
        method: "get",
        redirect: "manual"
      }
    );
  });

  it("should add ApiKey header to Third Party service call with API_KEY configuration when user is a PROD user", async () => {
    const aProdFiscalCode = "GRBRPP87L04L741X" as FiscalCode;

    const client = getThirdPartyServiceClient(
      aRemoteContentConfigurationWithBothEnv,
      mockNodeFetch,
      lollipopParams
    )(aProdFiscalCode);

    await client.getThirdPartyMessageDetails({
      id: aThirdPartyId,
      ...lollipopParams
    });
    const expectedConfig = aRemoteContentConfigurationWithBothEnv.prod_environment!;

    expect(mockNodeFetch).toHaveBeenCalledWith(
      `${expectedConfig.base_url}/messages/${aThirdPartyId}`,
      {
        headers: {
          fiscal_code: aProdFiscalCode,
          [expectedConfig.details_authentication.header_key_name]:
            expectedConfig.details_authentication.key,
          ...lollipopParams
        },
        method: "get",
        redirect: "manual"
      }
    );
  });

  it("should handle fetch for PN service with adapter data (get detail)", async () => {
    const aProdFiscalCode = "GRBRPP87L04L741X" as FiscalCode;

    const client = getThirdPartyServiceClient(
      { ...aRemoteContentConfigurationWithBothEnv, configuration_id: aPNConfigurationId },
      mockNodeFetch,
      lollipopParams
    )(aProdFiscalCode);

    const res = await client.getThirdPartyMessageDetails({
      id: aThirdPartyId,
      ...lollipopParams
    });
    const expectedConfig = aRemoteContentConfigurationWithBothEnv.prod_environment!;

    expect(mockNodeFetch).toHaveBeenCalledWith(
      `${expectedConfig.base_url}/delivery/notifications/received/${aThirdPartyId}`,
      {
        headers: {
          Accept: "application/io+json",
          "x-pagopa-cx-taxid": aProdFiscalCode,
          "x-api-key": "anykey",
          [expectedConfig.details_authentication.header_key_name]:
            expectedConfig.details_authentication.key,
          ...lollipopParams
        },
        method: "get",
        redirect: "manual"
      }
    );

    expect(res).toMatchObject(
      E.right({
        status: 200,
        value: aPNThirdPartyNotification
      })
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
      { ...aRemoteContentConfigurationWithBothEnv, configuration_id: aConfigurationId },
      mockNodeFetch,
      lollipopParams
    )(aProdFiscalCode);

    const res = await client.getThirdPartyMessageAttachment({
      id: aThirdPartyId,
      attachment_url: "an/url",
      ...lollipopParams
    });
    const expectedConfig = aRemoteContentConfigurationWithBothEnv.prod_environment!;

    expect(res).toMatchObject(
      E.right({
        status: 200,
        value: buffer
      })
    );

    expect(mockNodeFetch).toHaveBeenCalledWith(
      `${expectedConfig.base_url}/messages/${aThirdPartyId}/an/url`,
      {
        headers: {
          fiscal_code: aProdFiscalCode,
          [expectedConfig.details_authentication.header_key_name]:
            expectedConfig.details_authentication.key,
          ...lollipopParams
        },
        method: "get",
        redirect: "manual"
      }
    );
  });

  it("should handle fetch for PN service with adapter data (get attachment)", async () => {
    const aProdFiscalCode = "GRBRPP87L04L741X" as FiscalCode;

    const client = getThirdPartyServiceClient(
      { ...aRemoteContentConfigurationWithBothEnv, configuration_id: aPNConfigurationId },
      mockNodeFetch,
      lollipopParams
    )(aProdFiscalCode);

    await client.getThirdPartyMessageAttachment({
      id: aThirdPartyId,
      attachment_url: `delivery/notifications/received/${aThirdPartyId}/attachments/documents/0`,
      ...lollipopParams
    });
    const expectedConfig = aRemoteContentConfigurationWithBothEnv.prod_environment!;

    expect(mockNodeFetch).toHaveBeenCalledWith(
      `${expectedConfig.base_url}/delivery/notifications/received/${aThirdPartyId}/attachments/documents/0`,
      {
        headers: {
          "x-pagopa-cx-taxid": aProdFiscalCode,
          "x-api-key": "anykey",
          [expectedConfig.details_authentication.header_key_name]:
            expectedConfig.details_authentication.key,
          ...lollipopParams
        },
        method: "get",
        redirect: "manual"
      }
    );
  });
});
