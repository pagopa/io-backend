import * as t from "io-ts";
import PagoPAEcommerceService from "../pagoPAEcommerceService";
import { PagoPaEcommerceClient } from "../../clients/pagopa-ecommerce";
import { TypeofApiResponse } from "@pagopa/ts-commons/lib/requests";
import { GetPaymentRequestInfoT } from "../../../generated/pagopa-ecommerce/requestTypes";
import { ProblemJson } from "../../../generated/pagopa-ecommerce/ProblemJson";
import { PaymentRequestsGetResponse } from "../../../generated/pagopa-ecommerce/PaymentRequestsGetResponse";
import { HttpStatusCode } from "../../../generated/pagopa-ecommerce/HttpStatusCode";
import { ValidationFaultPaymentDataErrorEnum } from "../../../generated/pagopa-ecommerce/ValidationFaultPaymentDataError";
import { FaultCodeCategoryEnum as Enum404 } from "../../../generated/pagopa-ecommerce/ValidationFaultPaymentDataErrorProblemJson";
import { FaultCodeCategoryEnum as Enum502 } from "../../../generated/pagopa-ecommerce/ValidationFaultPaymentUnavailableProblemJson";
import { FaultCodeCategoryEnum as Enum503 } from "../../../generated/pagopa-ecommerce/PartyConfigurationFaultPaymentProblemJson";
import { ValidationFaultPaymentUnavailableEnum } from "../../../generated/pagopa-ecommerce/ValidationFaultPaymentUnavailable";
import { PartyConfigurationFaultEnum } from "../../../generated/pagopa-ecommerce/PartyConfigurationFault";

const mockGetPaymentRequestInfo = jest.fn();
const mockGetPaymentRequestInfoUat = jest.fn();

const pagoPAEcommerceClientMock: PagoPaEcommerceClient = {
  getPaymentRequestInfo: mockGetPaymentRequestInfo,
  getCarts: jest.fn()
};

const pagopaEcommerceUatClientMock: PagoPaEcommerceClient = {
  getPaymentRequestInfo: mockGetPaymentRequestInfoUat,
  getCarts: jest.fn()
};

const rptId = "12345678912301230900000812348";
const aPaymentInfo: PaymentRequestsGetResponse = {
    amount: 11400 as any,
    rptId: rptId,
    paFiscalCode: "12345678912",
    paName: "AMA S.P.A.",
    description: "PAGAMENTO TARI ",
    dueDate: "2025-05-31"
};

const aProblemJson: ProblemJson = {
  status: 400 as HttpStatusCode,
  detail: "Bad Request",
  title: "BadRequest",
  type: "type",
  instance: "instance"
};

const validPaymentInfoResponse: TypeofApiResponse<GetPaymentRequestInfoT> = {
  headers: {},
  status: 200,
  value: aPaymentInfo
};

const anError400Response: TypeofApiResponse<GetPaymentRequestInfoT> = {
  headers: {},
  status: 400,
  value: aProblemJson
};

const anError401Response: TypeofApiResponse<GetPaymentRequestInfoT> = {
  headers: {},
  status: 401,
  value: undefined
};

const anError404Response: TypeofApiResponse<GetPaymentRequestInfoT> = {
  headers: {},
  status: 404,
  value: {
    faultCodeCategory: Enum404.PAYMENT_DATA_ERROR,
    faultCodeDetail: ValidationFaultPaymentDataErrorEnum.PPT_SINTASSI_EXTRAXSD,
    title: "Payment Request Not Found",
  }
};

const anError502Response: TypeofApiResponse<GetPaymentRequestInfoT> = {
  headers: {},
  status: 502,
  value: {
    faultCodeCategory: Enum502.PAYMENT_UNAVAILABLE,
    faultCodeDetail: ValidationFaultPaymentUnavailableEnum.PAA_SEMANTICA,
    title: "Payment Request Bad Gateway",
  }
};

const anError503Response: TypeofApiResponse<GetPaymentRequestInfoT> = {
  headers: {},
  status: 503,
  value: {
    faultCodeCategory: Enum503.DOMAIN_UNKNOWN,
    faultCodeDetail: PartyConfigurationFaultEnum.PAA_ATTIVA_RPT_IMPORTO_NON_VALIDO,
    title: "Payment Request Service Unavailable",
  }
};

const pagoPAEcommerceService = new PagoPAEcommerceService(
  pagoPAEcommerceClientMock,
  pagopaEcommerceUatClientMock
);

describe("PagoPAEcommerceService#getPaymentInfo", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use the test client when isTest is true", async () => {
    mockGetPaymentRequestInfoUat.mockImplementationOnce(() =>
        t.success(validPaymentInfoResponse)
    );

    const result = await pagoPAEcommerceService.getPaymentInfo(rptId, true);
    expect(mockGetPaymentRequestInfoUat).toHaveBeenCalledWith({ rpt_id: rptId });
     expect(result).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: validPaymentInfoResponse.value
    });
  });

  it("should use the prod client when isTest is false", async () => {
    mockGetPaymentRequestInfo.mockImplementationOnce(() =>
        t.success(validPaymentInfoResponse)
    );

    const result = await pagoPAEcommerceService.getPaymentInfo(rptId, false);
    expect(mockGetPaymentRequestInfo).toHaveBeenCalledWith({ rpt_id: rptId });
    expect(result).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: validPaymentInfoResponse.value
    });
  });

  it("returns 500 when the ecommerce api returns 400", async () => {
    mockGetPaymentRequestInfo.mockImplementationOnce(() =>
        t.success(anError400Response)
    );
    const result = await pagoPAEcommerceService.getPaymentInfo(rptId, false);
    expect(result.kind).toEqual("IResponseErrorInternal");
  });
  it("returns 500 when the ecommerce api returns 401", async () => {
    mockGetPaymentRequestInfo.mockImplementationOnce(() =>
        t.success(anError401Response)
    );
    const result = await pagoPAEcommerceService.getPaymentInfo(rptId, false);
    expect(result.kind).toEqual("IResponseErrorInternal");
  });

  it("returns 404 when the ecommerce api returns 404", async () => {
    mockGetPaymentRequestInfo.mockImplementationOnce(() =>
        t.success(anError404Response)
    );
    const result = await pagoPAEcommerceService.getPaymentInfo(rptId, false);
    expect(result.kind).toEqual("IResponseErrorNotFound");
  });

  it("returns 502 when the ecommerce api returns 502", async () => {
    mockGetPaymentRequestInfo.mockImplementationOnce(() =>
        t.success(anError502Response)
    );
    const result = await pagoPAEcommerceService.getPaymentInfo(rptId, false);
    expect(result.kind).toEqual("IResponseErrorBadGateway");
  });

  it("returns 503 when the ecommerce api returns 503", async () => {
    mockGetPaymentRequestInfo.mockImplementationOnce(() =>
        t.success(anError503Response)
    );
    const result = await pagoPAEcommerceService.getPaymentInfo(rptId, false);
    expect(result.kind).toEqual("IResponseErrorServiceUnavailable");
  });
});
