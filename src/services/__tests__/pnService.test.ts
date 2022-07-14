import { PNService } from "../pnService";
import * as PNClients from "../../clients/pn-clients";
import { PNClientFactory } from "../../clients/pn-clients";
import { ValidUrl } from "@pagopa/ts-commons/lib/url";
import { aFiscalCode } from "../../__mocks__/user_mock";
import { IoCourtesyDigitalAddressActivation } from "../../../generated/piattaforma-notifiche-courtesy/IoCourtesyDigitalAddressActivation";
import { isLeft, isRight } from "fp-ts/lib/Either";

const mockPnAddressBookIOClient = jest.spyOn(
  PNClients,
  "PnAddressBookIOClient"
);
const mockProdUrl = { href: "https://example.com/prod" } as ValidUrl;
const mockUATUrl = { href: "https://example.com/uat" } as ValidUrl;
const mockProdKey = "test-prod-key";
const mockUATKey = "test-uat-key";

const mockNodeFetch = jest.fn();

const anActivationStatusPayload: IoCourtesyDigitalAddressActivation = {
  activationStatus: true
};

describe("pnService#upsertPnServiceActivation", () => {
  const service = PNService(
    PNClientFactory(
      mockProdUrl,
      mockProdKey,
      mockUATUrl,
      mockUATKey,
      mockNodeFetch
    )
  );
  beforeEach(() => {
    jest.clearAllMocks();
    mockNodeFetch.mockImplementation(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        ({
          ok: true,
          status: 204,
          json: async () => {
            return;
          }
        } as Response)
    );
  });
  it("should call setCourtesyAddressIo with right PROD params", async () => {
    const response = await service.upsertPnActivation(
      PNClients.PNEnvironment.PRODUCTION,
      aFiscalCode,
      anActivationStatusPayload
    );
    expect(mockPnAddressBookIOClient).toBeCalledWith(
      mockProdUrl.href,
      mockProdKey,
      mockNodeFetch
    );
    expect(mockNodeFetch).toBeCalledWith(expect.any(String), {
      body: JSON.stringify(anActivationStatusPayload),
      headers: expect.objectContaining({
        "x-api-key": mockProdKey,
        "x-pagopa-cx-taxid": aFiscalCode
      }),
      method: "put"
    });
    expect(isRight(response)).toBeTruthy();
    if (isRight(response)) {
      expect(response.right).toEqual(
        expect.objectContaining({
          status: 204,
          value: undefined
        })
      );
    }
  });

  it("should call setCourtesyAddressIo with right UAT params", async () => {
    const response = await service.upsertPnActivation(
      PNClients.PNEnvironment.UAT,
      aFiscalCode,
      anActivationStatusPayload
    );
    expect(mockPnAddressBookIOClient).toBeCalledWith(
      mockUATUrl.href,
      mockUATKey,
      mockNodeFetch
    );
    expect(mockNodeFetch).toBeCalledWith(expect.any(String), {
      body: JSON.stringify(anActivationStatusPayload),
      headers: expect.objectContaining({
        "x-api-key": mockUATKey,
        "x-pagopa-cx-taxid": aFiscalCode
      }),
      method: "put"
    });
    expect(isRight(response)).toBeTruthy();
    if (isRight(response)) {
      expect(response.right).toEqual(
        expect.objectContaining({
          status: 204,
          value: undefined
        })
      );
    }
  });

  it("should return an error if setCourtesyAddressIo fails", async () => {
    const expectedError = new Error("error");
    mockNodeFetch.mockImplementationOnce(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Promise.reject(expectedError)
    );
    const responsePromise = service.upsertPnActivation(
      PNClients.PNEnvironment.UAT,
      aFiscalCode,
      anActivationStatusPayload
    );
    await expect(responsePromise).rejects.toThrowError(expectedError);
    expect(mockPnAddressBookIOClient).toBeCalledWith(
      mockUATUrl.href,
      mockUATKey,
      mockNodeFetch
    );
    expect(mockNodeFetch).toBeCalledWith(expect.any(String), {
      body: JSON.stringify(anActivationStatusPayload),
      headers: expect.objectContaining({
        "x-api-key": mockUATKey,
        "x-pagopa-cx-taxid": aFiscalCode
      }),
      method: "put"
    });
  });

  it("should return an error if the setCourtesyAddressIo response from PN is not valid", async () => {
    mockNodeFetch.mockImplementationOnce(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        ({
          ok: true,
          status: 299,
          json: async () => {
            return;
          }
        } as Response)
    );
    const response = await service.upsertPnActivation(
      PNClients.PNEnvironment.PRODUCTION,
      aFiscalCode,
      anActivationStatusPayload
    );
    expect(mockPnAddressBookIOClient).toBeCalledWith(
      mockProdUrl.href,
      mockProdKey,
      mockNodeFetch
    );
    expect(mockNodeFetch).toBeCalledWith(expect.any(String), {
      body: JSON.stringify(anActivationStatusPayload),
      headers: expect.objectContaining({
        "x-api-key": mockProdKey,
        "x-pagopa-cx-taxid": aFiscalCode
      }),
      method: "put"
    });
    expect(isLeft(response)).toBeTruthy();
  });
});

describe("pnService#getPnServiceActivation", () => {
  const service = PNService(
    PNClientFactory(
      mockProdUrl,
      mockProdKey,
      mockUATUrl,
      mockUATKey,
      mockNodeFetch
    )
  );
  beforeEach(() => {
    jest.clearAllMocks();
    mockNodeFetch.mockImplementation(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        ({
          ok: true,
          status: 200,
          json: async () => {
            return anActivationStatusPayload;
          }
        } as Response)
    );
  });
  it("should call getPnServiceActivation with right PROD params", async () => {
    const response = await service.getPnActivation(
      PNClients.PNEnvironment.PRODUCTION,
      aFiscalCode
    );
    expect(mockPnAddressBookIOClient).toBeCalledWith(
      mockProdUrl.href,
      mockProdKey,
      mockNodeFetch
    );
    expect(mockNodeFetch).toBeCalledWith(expect.any(String), {
      headers: expect.objectContaining({
        "x-api-key": mockProdKey,
        "x-pagopa-cx-taxid": aFiscalCode
      }),
      method: "get"
    });
    expect(isRight(response)).toBeTruthy();
    if (isRight(response)) {
      expect(response.right).toEqual(
        expect.objectContaining({
          status: 200,
          value: anActivationStatusPayload
        })
      );
    }
  });

  it("should call getPnServiceActivation with right UAT params", async () => {
    const response = await service.getPnActivation(
      PNClients.PNEnvironment.UAT,
      aFiscalCode
    );
    expect(mockPnAddressBookIOClient).toBeCalledWith(
      mockUATUrl.href,
      mockUATKey,
      mockNodeFetch
    );
    expect(mockNodeFetch).toBeCalledWith(expect.any(String), {
      headers: expect.objectContaining({
        "x-api-key": mockUATKey,
        "x-pagopa-cx-taxid": aFiscalCode
      }),
      method: "get"
    });
    expect(isRight(response)).toBeTruthy();
    if (isRight(response)) {
      expect(response.right).toEqual(
        expect.objectContaining({
          status: 200,
          value: anActivationStatusPayload
        })
      );
    }
  });

  it("should return an error if getCourtesyAddressIo fails", async () => {
    const expectedError = new Error("error");
    mockNodeFetch.mockImplementationOnce(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Promise.reject(expectedError)
    );
    const responsePromise = service.getPnActivation(
      PNClients.PNEnvironment.UAT,
      aFiscalCode
    );
    await expect(responsePromise).rejects.toThrowError(expectedError);
    expect(mockPnAddressBookIOClient).toBeCalledWith(
      mockUATUrl.href,
      mockUATKey,
      mockNodeFetch
    );
    expect(mockNodeFetch).toBeCalledWith(expect.any(String), {
      headers: expect.objectContaining({
        "x-api-key": mockUATKey,
        "x-pagopa-cx-taxid": aFiscalCode
      }),
      method: "get"
    });
  });

  it("should return an error if the getCourtesyAddressIo response from PN is not valid", async () => {
    mockNodeFetch.mockImplementationOnce(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        ({
          ok: true,
          status: 299,
          json: async () => {
            return anActivationStatusPayload;
          }
        } as Response)
    );
    const response = await service.getPnActivation(
      PNClients.PNEnvironment.PRODUCTION,
      aFiscalCode
    );
    expect(mockPnAddressBookIOClient).toBeCalledWith(
      mockProdUrl.href,
      mockProdKey,
      mockNodeFetch
    );
    expect(mockNodeFetch).toBeCalledWith(expect.any(String), {
      headers: expect.objectContaining({
        "x-api-key": mockProdKey,
        "x-pagopa-cx-taxid": aFiscalCode
      }),
      method: "get"
    });
    expect(isLeft(response)).toBeTruthy();
  });
});
