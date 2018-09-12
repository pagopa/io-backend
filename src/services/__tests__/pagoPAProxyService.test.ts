import { left, right } from "fp-ts/lib/Either";
import { internalError, notFoundError } from "../../types/error";
import PagoPAClientFactory from "../pagoPAClientFactory";
import PagoPAProxyService from "../pagoPAProxyService";

import { PaymentActivationsPostRequest } from "../../types/api/PaymentActivationsPostRequest";

const aRptId = "123456";
const acodiceContestoPagamento = "01234567890123456789012345678901";

const notFoundErrorMessage = "Not found.";
const internalErrorMessage = "Api error.";
const unknownErrorMessage = "Unknown response.";

const validPaymentInfoResponse = {
  status: 200,
  value: {
    codiceContestoPagamento: acodiceContestoPagamento,
    importoSingoloVersamento: 200
  }
};
const notFoundPaymentInfoResponse = {
  status: 404
};
const errorPaymentInfoResponse = {
  status: 500
};
const proxyPaymentInfoResponse = {
  status: 200,
  value: {
    codiceContestoPagamento: acodiceContestoPagamento,
    importoSingoloVersamento: 200
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
const notFoundActivatePaymentResponse = {
  status: 404
};
const errorActivatePaymentResponse = {
  status: 500
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
  status: 404
};
const errorActivationStatusResponse = {
  status: 500
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

const pagoPAProxy = new PagoPAClientFactory();

describe("PagoPAProxyService#getPaymentInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("get payment info", async () => {
    mockGetPaymentInfo.mockImplementation(() => {
      return validPaymentInfoResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockGetPaymentInfo).toHaveBeenCalledWith({ rptId: aRptId });
    expect(res).toEqual(right(proxyPaymentInfoResponse.value));
  });

  it("get payment info fails with error 404 if PagoPA proxy fails with error 404", async () => {
    mockGetPaymentInfo.mockImplementation(() => {
      return notFoundPaymentInfoResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockGetPaymentInfo).toHaveBeenCalledWith({ rptId: aRptId });
    expect(res).toEqual(left(notFoundError(notFoundErrorMessage)));
  });

  it("get payment info fails with error 500 if PagoPA proxy fails with error 500", async () => {
    mockGetPaymentInfo.mockImplementation(() => {
      return errorPaymentInfoResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockGetPaymentInfo).toHaveBeenCalledWith({ rptId: aRptId });
    expect(res).toEqual(left(internalError(internalErrorMessage)));
  });

  it("get payment info fails if if PagoPA proxy throws an error", async () => {
    mockGetPaymentInfo.mockImplementation(() => {
      throw new Error(unknownErrorMessage);
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockGetPaymentInfo).toHaveBeenCalledWith({ rptId: aRptId });
    expect(res).toEqual(left(internalError(unknownErrorMessage)));
  });
});

describe("PagoPAProxyService#activatePayment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("activate payment", async () => {
    mockActivatePayment.mockImplementation(() => {
      return validActivatePaymentResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockActivatePayment).toHaveBeenCalledWith({
      payload: validPaymentActivation
    });
    expect(res).toEqual(right(proxyActivatePaymentResponse));
  });

  it("activate payment fails with error 404 if PagoPA proxy fails with error 404", async () => {
    mockActivatePayment.mockImplementation(() => {
      return notFoundActivatePaymentResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockActivatePayment).toHaveBeenCalledWith({
      payload: validPaymentActivation
    });
    expect(res).toEqual(left(notFoundError(notFoundErrorMessage)));
  });

  it("activate payment fails with error 500 if PagoPA proxy fails with error 500", async () => {
    mockActivatePayment.mockImplementation(() => {
      return errorActivatePaymentResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockActivatePayment).toHaveBeenCalledWith({
      payload: validPaymentActivation
    });
    expect(res).toEqual(left(internalError(internalErrorMessage)));
  });

  it("activate payment fails if if PagoPA proxy throws an error", async () => {
    mockActivatePayment.mockImplementation(() => {
      throw new Error(unknownErrorMessage);
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockActivatePayment).toHaveBeenCalledWith({
      payload: validPaymentActivation
    });
    expect(res).toEqual(left(internalError(unknownErrorMessage)));
  });
});

describe("PagoPAProxyService#getActivationStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("get activation status", async () => {
    mockGetActivationStatus.mockImplementation(() => {
      return validActivationStatusResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(acodiceContestoPagamento);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockGetActivationStatus).toHaveBeenCalledWith({
      codiceContestoPagamento: acodiceContestoPagamento
    });
    expect(res).toEqual(right(proxyActivationStatusResponse));
  });

  it("get activation status fails with error 404 if PagoPA proxy fails with error 404", async () => {
    mockGetActivationStatus.mockImplementation(() => {
      return notFoundActivationStatusResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(acodiceContestoPagamento);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockGetActivationStatus).toHaveBeenCalledWith({
      codiceContestoPagamento: acodiceContestoPagamento
    });
    expect(res).toEqual(left(notFoundError(notFoundErrorMessage)));
  });

  it("get activation status fails with error 500 if PagoPA proxy fails with error 500", async () => {
    mockGetActivationStatus.mockImplementation(() => {
      return errorActivationStatusResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(acodiceContestoPagamento);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockGetActivationStatus).toHaveBeenCalledWith({
      codiceContestoPagamento: acodiceContestoPagamento
    });
    expect(res).toEqual(left(internalError(internalErrorMessage)));
  });

  it("get activation info fails if if PagoPA proxy throws an error", async () => {
    mockGetActivationStatus.mockImplementation(() => {
      throw new Error(unknownErrorMessage);
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(acodiceContestoPagamento);

    expect(mockGetClient).toHaveBeenCalledWith();
    expect(mockGetActivationStatus).toHaveBeenCalledWith({
      codiceContestoPagamento: acodiceContestoPagamento
    });
    expect(res).toEqual(left(internalError(unknownErrorMessage)));
  });
});
