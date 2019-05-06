/* tslint:disable:no-object-mutation */

import {
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import mockReq from "../../__mocks__/request";
import PagoPAClientFactory from "../../services/pagoPAClientFactory";
import PagoPAProxyService from "../../services/pagoPAProxyService";
import PagoPAProxyController from "../pagoPAProxyController";

const aRptId = "123456";
const anIdPagamento = "123456";
const aCodiceContestoPagamento = "01234567890123456789012345678901";

const internalErrorMessage = "Internal error.";

const paymentActivationsPostRequest = {
  codiceContestoPagamento: aCodiceContestoPagamento,
  importoSingoloVersamento: 200,
  rptId: "12345678901012123456789012345"
};

const proxyPaymentInfoResponse = {
  codiceContestoPagamento: aCodiceContestoPagamento,
  importoSingoloVersamento: 200
};

const proxyPaymentActivationsPostResponse = {
  causaleVersamento: "IMU 2018",
  codiceContestoPagamento: aCodiceContestoPagamento,
  enteBeneficiario: {
    capBeneficiario: "92010",
    civicoBeneficiario: "23",
    codiceUnitOperBeneficiario: "01",
    denomUnitOperBeneficiario: "CDC",
    denominazioneBeneficiario: "Comune di Canicattì",
    identificativoUnivocoBeneficiario: "123",
    indirizzoBeneficiario: "Via Roma",
    localitaBeneficiario: "Canicattì",
    nazioneBeneficiario: "IT",
    provinciaBeneficiario: "Agrigento"
  },
  ibanAccredito: "IT17X0605502100000001234567",
  importoSingoloVersamento: 10052
};

const proxyPaymentActivationsGetResponse = {
  idPagamento: anIdPagamento
};

const aResponseErrorInternal = {
  apply: expect.any(Function),
  detail: expect.any(String),
  kind: "IResponseErrorInternal"
};

const mockActivatePayment = jest.fn();
const mockGetActivationStatus = jest.fn();
const mockGetPaymentInfo = jest.fn();
jest.mock("../../services/pagoPAProxyService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      activatePayment: mockActivatePayment,
      getActivationStatus: mockGetActivationStatus,
      getPaymentInfo: mockGetPaymentInfo
    }))
  };
});

describe("PagoPAProxyController#getPaymentInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getPaymentInfo on the PagoPAProxyService with valid values", async () => {
    const req = mockReq();

    mockGetPaymentInfo.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyPaymentInfoResponse))
    );

    req.params = { rptId: aRptId };
    req.query = {};

    const pagoPAClientFactory = new PagoPAClientFactory(
      process.env.PAGOPA_API_URL as string,
      process.env.PAGOPA_API_URL_TEST as string
    );
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getPaymentInfo(req);

    expect(mockGetPaymentInfo).toHaveBeenCalledWith(aRptId, false);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyPaymentInfoResponse
    });
  });

  it("[TEST env] calls the getPaymentInfo on the PagoPAProxyService with valid values", async () => {
    const req = mockReq();

    mockGetPaymentInfo.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyPaymentInfoResponse))
    );

    req.params = { rptId: aRptId };
    req.query = { test: "true" };

    const pagoPAClientFactory = new PagoPAClientFactory(
      process.env.PAGOPA_API_URL as string,
      process.env.PAGOPA_API_URL_TEST as string
    );
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getPaymentInfo(req);

    expect(mockGetPaymentInfo).toHaveBeenCalledWith(aRptId, true);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyPaymentInfoResponse
    });
  });

  it("fails if the call to getPaymentInfo fails", async () => {
    const req = mockReq();

    mockGetPaymentInfo.mockReturnValue(
      Promise.resolve(ResponseErrorInternal(internalErrorMessage))
    );

    req.params = { rptId: aRptId };
    req.query = {};

    const pagoPAClientFactory = new PagoPAClientFactory(
      process.env.PAGOPA_API_URL as string,
      process.env.PAGOPA_API_URL_TEST as string
    );
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getPaymentInfo(req);

    expect(mockGetPaymentInfo).toHaveBeenCalledWith(aRptId, false);
    expect(response).toEqual(aResponseErrorInternal);
  });
});

describe("PagoPAProxyController#activatePayment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the activatePayment on the PagoPAProxyService with valid values", async () => {
    const req = mockReq();

    mockActivatePayment.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyPaymentActivationsPostResponse))
    );

    req.body = paymentActivationsPostRequest;
    req.query = {};

    const pagoPAClientFactory = new PagoPAClientFactory(
      process.env.PAGOPA_API_URL as string,
      process.env.PAGOPA_API_URL_TEST as string
    );
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.activatePayment(req);

    expect(mockActivatePayment).toHaveBeenCalledWith(
      paymentActivationsPostRequest,
      false
    );

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyPaymentActivationsPostResponse
    });
  });

  it("[TEST env] calls the activatePayment on the PagoPAProxyService with valid values", async () => {
    const req = mockReq();

    mockActivatePayment.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyPaymentActivationsPostResponse))
    );

    req.body = paymentActivationsPostRequest;
    req.query = { test: "true" };

    const pagoPAClientFactory = new PagoPAClientFactory(
      process.env.PAGOPA_API_URL as string,
      process.env.PAGOPA_API_URL_TEST as string
    );
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.activatePayment(req);

    expect(mockActivatePayment).toHaveBeenCalledWith(
      paymentActivationsPostRequest,
      true
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyPaymentActivationsPostResponse
    });
  });

  it("fails if the call to activatePayment fails", async () => {
    const req = mockReq();

    mockActivatePayment.mockReturnValue(
      Promise.resolve(ResponseErrorInternal(internalErrorMessage))
    );

    req.body = paymentActivationsPostRequest;
    req.query = {};

    const pagoPAClientFactory = new PagoPAClientFactory(
      process.env.PAGOPA_API_URL as string,
      process.env.PAGOPA_API_URL_TEST as string
    );
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.activatePayment(req);

    expect(mockActivatePayment).toHaveBeenCalledWith(
      paymentActivationsPostRequest,
      false
    );
    expect(response).toEqual(aResponseErrorInternal);
  });
});

describe("PagoPAProxyController#getActivationStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getActivationStatus on the PagoPAProxyService with valid values", async () => {
    const req = mockReq();

    mockGetActivationStatus.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyPaymentActivationsGetResponse))
    );

    req.params = { codiceContestoPagamento: aCodiceContestoPagamento };
    req.query = {};

    const pagoPAClientFactory = new PagoPAClientFactory(
      process.env.PAGOPA_API_URL as string,
      process.env.PAGOPA_API_URL_TEST as string
    );
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getActivationStatus(req);

    expect(mockGetActivationStatus).toHaveBeenCalledWith(
      aCodiceContestoPagamento,
      false
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyPaymentActivationsGetResponse
    });
  });

  it("[TEST env] calls the getActivationStatus on the PagoPAProxyService with valid values", async () => {
    const req = mockReq();

    mockGetActivationStatus.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyPaymentActivationsGetResponse))
    );

    req.params = { codiceContestoPagamento: aCodiceContestoPagamento };
    req.query = { test: "true" };

    const pagoPAClientFactory = new PagoPAClientFactory(
      process.env.PAGOPA_API_URL as string,
      process.env.PAGOPA_API_URL_TEST as string
    );
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getActivationStatus(req);

    expect(mockGetActivationStatus).toHaveBeenCalledWith(
      aCodiceContestoPagamento,
      true
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyPaymentActivationsGetResponse
    });
  });

  it("fails if the call to getActivationStatus fails", async () => {
    const req = mockReq();

    mockGetActivationStatus.mockReturnValue(
      Promise.resolve(ResponseErrorInternal(internalErrorMessage))
    );

    req.params = { codiceContestoPagamento: aCodiceContestoPagamento };
    req.query = {};

    const pagoPAClientFactory = new PagoPAClientFactory(
      process.env.PAGOPA_API_URL as string,
      process.env.PAGOPA_API_URL_TEST as string
    );
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getActivationStatus(req);

    expect(mockGetActivationStatus).toHaveBeenCalledWith(
      aCodiceContestoPagamento,
      false
    );
    expect(response).toEqual(aResponseErrorInternal);
  });
});
