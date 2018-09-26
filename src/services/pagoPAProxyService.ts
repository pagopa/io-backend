import { log } from "../utils/logger";
import { IPagoPAClientFactoryInterface } from "./IPagoPAClientFactory";

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import {
  AltPagopaResponseType,
  BasePagopaResponseType
} from "../clients/pagopa";
import {
  ActivatePaymentT,
  GetActivationStatusT,
  GetPaymentInfoT
} from "../types/api/requestTypes";
import { AsControllerFunction } from "../utils/types";

const messageErrorOnUnknownError = "Unknown response.";
const messageErrorOnApiError = "Api error.";
const logErrorOnStatusNotOK = "Status is not 200: %s";
const logErrorOnDecodeError = "Response can't be decoded: %O";
const logErrorOnUnknownError = "Unknown error: %s";
const logErrorOnNotFound = "Not found";
const logErrorOnBadRequest = "Bad request";

type BaseResponse<T> =
  | IResponseErrorInternal
  | IResponseErrorValidation
  | IResponseSuccessJson<T>;

/**
 * Parse 200, 400 and 500 responses
 */
function parseBaseResponse<T>(
  res: BasePagopaResponseType<T> | undefined
): BaseResponse<T> {
  if (res === undefined) {
    log.error(logErrorOnDecodeError, res);
    return ResponseErrorInternal(messageErrorOnApiError);
  }
  if (res.status === 200) {
    return ResponseSuccessJson(res.value);
  }
  if (res.status === 400) {
    log.error(logErrorOnBadRequest, res.status);
    return ResponseErrorValidation(
      res.value.title || "unknown",
      res.value.detail || "unknown"
    );
  }
  log.error(logErrorOnStatusNotOK, res.status);
  return ResponseErrorInternal(res.value.detail || "unknown");
}

/**
 * Adds 404 errors to parseBaseResponse
 */
function parseAltResponse<T>(
  res: AltPagopaResponseType<T> | undefined
): IResponseErrorNotFound | BaseResponse<T> {
  if (res !== undefined && res.status === 404) {
    log.error(logErrorOnBadRequest, res.status);
    return ResponseErrorNotFound(logErrorOnNotFound, "");
  }
  return parseBaseResponse(res);
}

export default class PagoPAProxyService {
  constructor(private readonly pagoPAClient: IPagoPAClientFactoryInterface) {}

  /**
   * Retrieve information about a payment.
   */
  public readonly getPaymentInfo: AsControllerFunction<
    GetPaymentInfoT
  > = async params => {
    try {
      const client = this.pagoPAClient.getClient();

      const res = await client.getPaymentInfo({
        rptIdFromString: params.rptId
      });

      return parseBaseResponse(res);
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return ResponseErrorInternal(messageErrorOnUnknownError);
    }
  };

  /**
   * Require a lock (activation) for a payment.
   */
  public readonly activatePayment: AsControllerFunction<
    ActivatePaymentT
  > = async params => {
    try {
      const client = this.pagoPAClient.getClient();

      const res = await client.activatePayment(params);

      return parseBaseResponse(res);
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return ResponseErrorInternal(messageErrorOnUnknownError);
    }
  };

  /**
   * Check the activation status to retrieve the paymentId.
   */
  public readonly getActivationStatus: AsControllerFunction<
    GetActivationStatusT
  > = async params => {
    try {
      const client = this.pagoPAClient.getClient();

      const res = await client.getActivationStatus(params);

      return parseAltResponse(res);
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return ResponseErrorInternal(messageErrorOnUnknownError);
    }
  };
}
