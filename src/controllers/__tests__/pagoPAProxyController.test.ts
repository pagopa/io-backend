import {
  ResponseErrorInternal,
  ResponseSuccessJson
} from "io-ts-commons/lib/responses";
import mockReq from "../../__mocks__/request";
import PagoPAClientFactory from "../../services/pagoPAClientFactory";
import PagoPAProxyService from "../../services/pagoPAProxyService";
import PagoPAProxyController from "../pagoPAProxyController";

const aRptId = "123456";
const anIdPagamento = "123456";
const aCodiceContestoPagamento = "ABC123";

const internalErrorMessage = "Internal error.";

const paymentActivationsPostRequest = {
  codiceContestoPagamento: "ABC123",
  importoSingoloVersamento: 200,
  rptId: "12345678901012123456789012345"
};

const proxyPaymentInfoResponse = {
  codiceContestoPagamento: "ABC123",
  importoSingoloVersamento: 200
};

const proxyPaymentActivationsPostResponse = {
  causaleVersamento: "IMU 2018",
  codiceContestoPagamento: "5925113079f511e8ba1d4bb98b28cfc7",
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

    const pagoPAClientFactory = new PagoPAClientFactory();
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getPaymentInfo(req);

    expect(mockGetPaymentInfo).toHaveBeenCalledWith({ rptId: aRptId });
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

    const pagoPAClientFactory = new PagoPAClientFactory();
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getPaymentInfo(req);

    expect(mockGetPaymentInfo).toHaveBeenCalledWith({ rptId: aRptId });
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorInternal"
    });
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

    const pagoPAClientFactory = new PagoPAClientFactory();
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.activatePayment(req);

    expect(mockActivatePayment).toHaveBeenCalledWith({
      paymentActivationsPostRequest
    });
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

    const pagoPAClientFactory = new PagoPAClientFactory();
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.activatePayment(req);

    expect(mockActivatePayment).toHaveBeenCalledWith({
      paymentActivationsPostRequest
    });
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorInternal"
    });
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

    const pagoPAClientFactory = new PagoPAClientFactory();
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getActivationStatus(req);

    expect(mockGetActivationStatus).toHaveBeenCalledWith({
      codiceContestoPagamento: aCodiceContestoPagamento
    });
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

    const pagoPAClientFactory = new PagoPAClientFactory();
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getActivationStatus(req);

    expect(mockGetActivationStatus).toHaveBeenCalledWith({
      codiceContestoPagamento: aCodiceContestoPagamento
    });
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorInternal"
    });
  });
});
