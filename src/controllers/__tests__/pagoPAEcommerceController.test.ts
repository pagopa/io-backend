import {
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import mockReq from "../../__mocks__/request";
import PagoPAEcommerceController from "../pagoPAEcommerceController";
import PagoPAEcommerceService from "../../services/pagoPAEcommerceService";
import { PaymentInfoResponse } from "../../../generated/backend/PaymentInfoResponse";

const aRptId = "12345678912301230900000812348";
const aPaymentInfo: PaymentInfoResponse = {
  amount: 11400 as any,
  rptId: aRptId,
  paFiscalCode: "12345678912",
  paName: "AMA S.P.A.",
  description: "PAGAMENTO TARI ",
  dueDate: "2025-05-31"
};

const anInternalError = "Unexpected error from PagoPA Ecommerce API"

const mockGetPaymentInfo = jest.fn();
const pagoPAEcommerceServiceMock = {
  getPaymentInfo: mockGetPaymentInfo
} as any as PagoPAEcommerceService;

const pagoPAEcommerceController = new PagoPAEcommerceController(pagoPAEcommerceServiceMock);

describe("pagoPAEcommerceController#getPaymentInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("return a 200 response when it is called with valid values", async () => {
    const req = mockReq();

    mockGetPaymentInfo.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aPaymentInfo))
    );

    req.params = { rptId: aRptId };
    req.query = {};

    const response = await pagoPAEcommerceController.getPaymentInfo(req);

    expect(mockGetPaymentInfo).toHaveBeenCalledWith(aRptId, false);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aPaymentInfo
    });
  });

  it("return a 200 response when it is called with valid values and test param true", async () => {
    const req = mockReq();

    mockGetPaymentInfo.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aPaymentInfo))
    );

    req.params = { rptId: aRptId };
    req.query = { test: "true" };

    const response = await pagoPAEcommerceController.getPaymentInfo(req);

    expect(mockGetPaymentInfo).toHaveBeenCalledWith(aRptId, true);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aPaymentInfo
    });
  });

  it("fails if the call to getPaymentInfo fails", async () => {
    const req = mockReq();

    mockGetPaymentInfo.mockReturnValue(
      Promise.resolve(ResponseErrorInternal(anInternalError))
    );

    req.params = { rptId: aRptId };
    req.query = {};

    const response = await pagoPAEcommerceController.getPaymentInfo(req);

    expect(mockGetPaymentInfo).toHaveBeenCalledWith(aRptId, false);
    expect(response.detail).toEqual(`Internal server error: ${anInternalError}`);
    expect(response.kind).toEqual("IResponseErrorInternal");
  });
});

