import { left, right } from "fp-ts/lib/Either";
import { internalError, notFoundError } from "../../types/error";
import PagoPAClientFactory from "../pagoPAClientFactory";
import PagoPAProxyService from "../pagoPAProxyService";

const aRptId = "123456";
const acodiceContestoPagamento = "ABC123";

const notFoundErrorMessage = "Not found.";
const internalErrorMessage = "Api error.";
const unknownErrorMessage = "Unknown response.";

const validPaymentInfoResponse = {
  parsedBody: {
    codiceContestoPagamento: "ABC123",
    importoSingoloVersamento: 200
  },
  response: {
    status: 200
  }
};
const notFoundPaymentInfoResponse = {
  parsedBody: {},
  response: {
    status: 404
  }
};
const errorPaymentInfoResponse = {
  parsedBody: {},
  response: {
    status: 500
  }
};
const proxyPaymentInfoResponse = {
  codiceContestoPagamento: "ABC123",
  importoSingoloVersamento: 200
};

const validPaymentActivation = {
  codiceContestoPagamento: "ABC123",
  importoSingoloVersamento: 200,
  rptId: "12345678901012123456789012345"
};
const validActivatePaymentResponse = {
  parsedBody: {
    importoSingoloVersamento: 200
  },
  response: {
    status: 200
  }
};
const notFoundActivatePaymentResponse = {
  parsedBody: {},
  response: {
    status: 404
  }
};
const errorActivatePaymentResponse = {
  parsedBody: {},
  response: {
    status: 500
  }
};
const proxyActivatePaymentResponse = {
  importoSingoloVersamento: 200
};

const validActivationStatusResponse = {
  parsedBody: {
    idPagamento: "123455"
  },
  response: {
    status: 200
  }
};
const notFoundActivationStatusResponse = {
  parsedBody: {},
  response: {
    status: 404
  }
};
const errorActivationStatusResponse = {
  parsedBody: {},
  response: {
    status: 500
  }
};
const proxyActivationStatusResponse = {
  idPagamento: "123455"
};

const activatePaymentPayload = {
  body: {
    codiceContestoPagamento: "ABC123",
    importoSingoloVersamento: 200,
    rptId: "12345678901012123456789012345"
  }
};

const mockActivatePayment = jest.fn();
const mockGetActivationStatus = jest.fn();
const mockGetPaymentInfo = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    activatePaymentWithHttpOperationResponse: mockActivatePayment,
    getActivationStatusWithHttpOperationResponse: mockGetActivationStatus,
    getPaymentInfoWithHttpOperationResponse: mockGetPaymentInfo
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

    expect(mockGetClient).toHaveBeenCalledWith("", aRptId);
    expect(mockGetPaymentInfo).toHaveBeenCalledWith();
    expect(res).toEqual(right(proxyPaymentInfoResponse));
  });

  it("get payment info fails with error 404 if PagoPA proxy fails with error 404", async () => {
    mockGetPaymentInfo.mockImplementation(() => {
      return notFoundPaymentInfoResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId);

    expect(mockGetClient).toHaveBeenCalledWith("", aRptId);
    expect(mockGetPaymentInfo).toHaveBeenCalledWith();
    expect(res).toEqual(left(notFoundError(notFoundErrorMessage)));
  });

  it("get payment info fails with error 500 if PagoPA proxy fails with error 500", async () => {
    mockGetPaymentInfo.mockImplementation(() => {
      return errorPaymentInfoResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId);

    expect(mockGetClient).toHaveBeenCalledWith("", aRptId);
    expect(mockGetPaymentInfo).toHaveBeenCalledWith();
    expect(res).toEqual(left(internalError(internalErrorMessage)));
  });

  it("get payment info fails if if PagoPA proxy throws an error", async () => {
    mockGetPaymentInfo.mockImplementation(() => {
      throw new Error(unknownErrorMessage);
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getPaymentInfo(aRptId);

    expect(mockGetClient).toHaveBeenCalledWith("", aRptId);
    expect(mockGetPaymentInfo).toHaveBeenCalledWith();
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

    expect(mockGetClient).toHaveBeenCalledWith("", "");
    expect(mockActivatePayment).toHaveBeenCalledWith(activatePaymentPayload);
    expect(res).toEqual(right(proxyActivatePaymentResponse));
  });

  it("activate payment fails with error 404 if PagoPA proxy fails with error 404", async () => {
    mockActivatePayment.mockImplementation(() => {
      return notFoundActivatePaymentResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation);

    expect(mockGetClient).toHaveBeenCalledWith("", "");
    expect(mockActivatePayment).toHaveBeenCalledWith(activatePaymentPayload);
    expect(res).toEqual(left(notFoundError(notFoundErrorMessage)));
  });

  it("activate payment fails with error 500 if PagoPA proxy fails with error 500", async () => {
    mockActivatePayment.mockImplementation(() => {
      return errorActivatePaymentResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation);

    expect(mockGetClient).toHaveBeenCalledWith("", "");
    expect(mockActivatePayment).toHaveBeenCalledWith(activatePaymentPayload);
    expect(res).toEqual(left(internalError(internalErrorMessage)));
  });

  it("activate payment fails if if PagoPA proxy throws an error", async () => {
    mockActivatePayment.mockImplementation(() => {
      throw new Error(unknownErrorMessage);
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.activatePayment(validPaymentActivation);

    expect(mockGetClient).toHaveBeenCalledWith("", "");
    expect(mockActivatePayment).toHaveBeenCalledWith(activatePaymentPayload);
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

    expect(mockGetClient).toHaveBeenCalledWith(acodiceContestoPagamento, "");
    expect(mockGetActivationStatus).toHaveBeenCalledWith();
    expect(res).toEqual(right(proxyActivationStatusResponse));
  });

  it("get activation status fails with error 404 if PagoPA proxy fails with error 404", async () => {
    mockGetActivationStatus.mockImplementation(() => {
      return notFoundActivationStatusResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(acodiceContestoPagamento);

    expect(mockGetClient).toHaveBeenCalledWith(acodiceContestoPagamento, "");
    expect(mockGetActivationStatus).toHaveBeenCalledWith();
    expect(res).toEqual(left(notFoundError(notFoundErrorMessage)));
  });

  it("get activation status fails with error 500 if PagoPA proxy fails with error 500", async () => {
    mockGetActivationStatus.mockImplementation(() => {
      return errorActivationStatusResponse;
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(acodiceContestoPagamento);

    expect(mockGetClient).toHaveBeenCalledWith(acodiceContestoPagamento, "");
    expect(mockGetActivationStatus).toHaveBeenCalledWith();
    expect(res).toEqual(left(internalError(internalErrorMessage)));
  });

  it("get activation info fails if if PagoPA proxy throws an error", async () => {
    mockGetActivationStatus.mockImplementation(() => {
      throw new Error(unknownErrorMessage);
    });

    const service = new PagoPAProxyService(pagoPAProxy);

    const res = await service.getActivationStatus(acodiceContestoPagamento);

    expect(mockGetClient).toHaveBeenCalledWith(acodiceContestoPagamento, "");
    expect(mockGetActivationStatus).toHaveBeenCalledWith();
    expect(res).toEqual(left(internalError(unknownErrorMessage)));
  });
});
