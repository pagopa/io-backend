import { left, right } from "fp-ts/lib/Either";
import mockReq from "../../__mocks__/request";
import PagoPAClientFactory from "../../services/pagoPAClientFactory";
import PagoPAProxyService from "../../services/pagoPAProxyService";
import { internalError } from "../../types/error";
import PagoPAProxyController from "../pagoPAProxyController";

const aRptId = "123456";

const internalErrorMessage = "Internal error.";

const proxyPaymentInfoResponse = {
  codiceContestoPagamento: "ABC123",
  importoSingoloVersamento: 200
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
      Promise.resolve(right(proxyPaymentInfoResponse))
    );

    req.params = { rptId: aRptId };

    const pagoPAClientFactory = new PagoPAClientFactory();
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getPaymentInfo(req);

    expect(mockGetPaymentInfo).toHaveBeenCalledWith(aRptId);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyPaymentInfoResponse
    });
  });

  it("fails if the call to getPaymentInfo fails", async () => {
    const req = mockReq();

    mockGetPaymentInfo.mockReturnValue(
      Promise.resolve(left(internalError(internalErrorMessage)))
    );

    req.params = { rptId: aRptId };

    const pagoPAClientFactory = new PagoPAClientFactory();
    const pagoPAProxyService = new PagoPAProxyService(pagoPAClientFactory);
    const controller = new PagoPAProxyController(pagoPAProxyService);

    const response = await controller.getPaymentInfo(req);

    expect(mockGetPaymentInfo).toHaveBeenCalledWith(aRptId);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorInternal"
    });
  });
});
