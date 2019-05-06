import * as t from "io-ts";
import { TypeofApiResponse } from "italia-ts-commons/lib/requests";

import PagoPAClientFactory from "../pagoPAClientFactory";
import PagoPAProxyService from "../pagoPAProxyService";

import { CodiceContestoPagamento } from "../../../generated/pagopa-proxy/CodiceContestoPagamento";
import { ImportoEuroCents } from "../../../generated/pagopa-proxy/ImportoEuroCents";
import { PaymentActivationsPostRequest } from "../../../generated/pagopa-proxy/PaymentActivationsPostRequest";
import { PaymentFaultEnum } from "../../../generated/pagopa-proxy/PaymentFault";
import { GetPaymentInfoT } from "../../../generated/pagopa-proxy/requestTypes";
import { PagoPAEnvironment } from "../IPagoPAClientFactory";

const aRptId = "123456";
const acodiceContestoPagamento = "01234567890123456789012345678901" as CodiceContestoPagamento;

const unknownErrorMessage = "Unknown response.";

const validPaymentInfoResponse: TypeofApiResponse<GetPaymentInfoT> = {
  headers: {},
  status: 200,
  value: {
    codiceContestoPagamento: acodiceContestoPagamento,
    importoSingoloVersamento: 200 as ImportoEuroCents
  }
};

const badRequestPaymentInfoResponse: TypeofApiResponse<GetPaymentInfoT> = {
  headers: {},
  status: 400,
  value: { title: "Request not valid" }
};

const errorPaymentInfoResponse: TypeofApiResponse<GetPaymentInfoT> = {
  headers: {},
  status: 500,
  value: {
    detail: PaymentFaultEnum.PAYMENT_UNAVAILABLE
  }
};

const proxyPaymentInfoResponse: TypeofApiResponse<GetPaymentInfoT> = {
  headers: {},
  status: 200,
  value: {
    codiceContestoPagamento: acodiceContestoPagamento,
    importoSingoloVersamento: 200 as ImportoEuroCents
  }
};

const validPaymentActivation: PaymentActivationsPostRequest = PaymentActivationsPostRequest.decode(
  {
    codiceContestoPagamento: acodiceContestoPagamento,
    importoSingoloVersamento: 200,
    rptId: "12345678901012123456789012312"
  }
).getOrElseL(errors => {
  throw Error(`Invalid RptId to decode: ${JSON.stringify(errors)}`);
});

const validActivatePaymentResponse = {
  status: 200,
  value: {
    importoSingoloVersamento: 200
  }
};
const badRequestActivatePaymentResponse = {
  status: 400,
  value: Error("Activate bad request")
};
const errorActivatePaymentResponse = {
  status: 500,
  value: Error("Activate error")
};
const proxyActivatePaymentResponse = {
  importoSingoloVersamento:
    validActivatePaymentResponse.value.importoSingoloVersamento
};

const validActivationStatusResponse = {
  status: 200,
  value: {
    idPagamento: "123455"
  }
};
const notFoundActivationStatusResponse = {
  status: 404,
  value: Error("Activation status not found")
};
const errorActivationStatusResponse = {
  status: 500,
  value: Error("Activation status error")
};
const proxyActivationStatusResponse = {
  idPagamento: validActivationStatusResponse.value.idPagamento
};

const mockActivatePayment = jest.fn();
const mockGetActivationStatus = jest.fn();
const mockGetPaymentInfo = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    activatePayment: mockActivatePayment,
    getActivationStatus: mockGetActivationStatus,
    getPaymentInfo: mockGetPaymentInfo
  };
});
jest.mock("../../services/pagoPAClientFactory", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getClient: mockGetClient
    }))
  };
});

const pagoPAProxy = new PagoPAClientFactory(
  process.env.PAGOPA_API_URL as string,
  process.env.PAGOPA_API_URL_TEST as string
);

describe("PagoPAProxyService#getPaymentInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("get payment info", async () => {
    mockGetPaymentInfo.mockImplementation(() =>
      t.success(validPaymentInfoResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId, false);

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockGetPaymentInfo).toHaveBeenCalledWith({
      rptId: aRptId
    });
    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyPaymentInfoResponse.value
    });
  });

  it("[TEST env] get payment info", async () => {
    mockGetPaymentInfo.mockImplementation(() =>
      t.success(validPaymentInfoResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId, true);

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.TEST);
    expect(mockGetPaymentInfo).toHaveBeenCalledWith({ rptId: aRptId });
    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyPaymentInfoResponse.value
    });
  });

  it("get payment info fails with error 400 if PagoPA proxy fails with error 400", async () => {
    mockGetPaymentInfo.mockImplementation(() =>
      t.success(badRequestPaymentInfoResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId, false);

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockGetPaymentInfo).toHaveBeenCalledWith({
      rptId: aRptId
    });
    expect(res.kind).toEqual("IResponseErrorValidation");
  });

  it("get payment info fails with error 500 if PagoPA proxy fails with error 500", async () => {
    mockGetPaymentInfo.mockImplementation(() =>
      t.success(errorPaymentInfoResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId, false);

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockGetPaymentInfo).toHaveBeenCalledWith({
      rptId: aRptId
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("get payment info fails if if PagoPA proxy throws an error", async () => {
    mockGetPaymentInfo.mockImplementation(() => {
      throw new Error(unknownErrorMessage);
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId, false);

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockGetPaymentInfo).toHaveBeenCalledWith({
      rptId: aRptId
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("PagoPAProxyService#activatePayment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("activate payment", async () => {
    mockActivatePayment.mockImplementation(() =>
      t.success(validActivatePaymentResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation, false);

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockActivatePayment).toHaveBeenCalledWith({
      paymentActivationsPostRequest: validPaymentActivation
    });
    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyActivatePaymentResponse
    });
  });

  it("[TEST env] activate payment", async () => {
    mockActivatePayment.mockImplementation(() =>
      t.success(validActivatePaymentResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation, true);

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.TEST);
    expect(mockActivatePayment).toHaveBeenCalledWith({
      paymentActivationsPostRequest: validPaymentActivation
    });
    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyActivatePaymentResponse
    });
  });

  it("activate payment fails with error 400 if PagoPA proxy fails with error 400", async () => {
    mockActivatePayment.mockImplementation(() =>
      t.success(badRequestActivatePaymentResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation, false);

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockActivatePayment).toHaveBeenCalledWith({
      paymentActivationsPostRequest: validPaymentActivation
    });
    expect(res.kind).toEqual("IResponseErrorValidation");
  });

  it("activate payment fails with error 500 if PagoPA proxy fails with error 500", async () => {
    mockActivatePayment.mockImplementation(() =>
      t.success(errorActivatePaymentResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation, false);

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockActivatePayment).toHaveBeenCalledWith({
      paymentActivationsPostRequest: validPaymentActivation
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("activate payment fails if if PagoPA proxy throws an error", async () => {
    mockActivatePayment.mockImplementation(() => {
      throw new Error(unknownErrorMessage);
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation, false);

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockActivatePayment).toHaveBeenCalledWith({
      paymentActivationsPostRequest: validPaymentActivation
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("PagoPAProxyService#getActivationStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("get activation status", async () => {
    mockGetActivationStatus.mockImplementation(() =>
      t.success(validActivationStatusResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(
      acodiceContestoPagamento,
      false
    );

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockGetActivationStatus).toHaveBeenCalledWith({
      codiceContestoPagamento: acodiceContestoPagamento
    });
    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyActivationStatusResponse
    });
  });

  it("[TEST env] get activation status", async () => {
    mockGetActivationStatus.mockImplementation(() =>
      t.success(validActivationStatusResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(
      acodiceContestoPagamento,
      true
    );

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.TEST);
    expect(mockGetActivationStatus).toHaveBeenCalledWith({
      codiceContestoPagamento: acodiceContestoPagamento
    });
    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyActivationStatusResponse
    });
  });

  it("get activation status fails with error 404 if PagoPA proxy fails with error 404", async () => {
    mockGetActivationStatus.mockImplementation(() =>
      t.success(notFoundActivationStatusResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(
      acodiceContestoPagamento,
      false
    );

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockGetActivationStatus).toHaveBeenCalledWith({
      codiceContestoPagamento: acodiceContestoPagamento
    });
    expect(res.kind).toEqual("IResponseErrorNotFound");
  });

  it("get activation status fails with error 500 if PagoPA proxy fails with error 500", async () => {
    mockGetActivationStatus.mockImplementation(() =>
      t.success(errorActivationStatusResponse)
    );

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(
      acodiceContestoPagamento,
      false
    );

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockGetActivationStatus).toHaveBeenCalledWith({
      codiceContestoPagamento: acodiceContestoPagamento
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("get activation info fails if if PagoPA proxy throws an error", async () => {
    mockGetActivationStatus.mockImplementation(() => {
      throw new Error(unknownErrorMessage);
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(
      acodiceContestoPagamento,
      false
    );

    expect(mockGetClient).toHaveBeenCalledWith(PagoPAEnvironment.PRODUCTION);
    expect(mockGetActivationStatus).toHaveBeenCalledWith({
      codiceContestoPagamento: acodiceContestoPagamento
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});
