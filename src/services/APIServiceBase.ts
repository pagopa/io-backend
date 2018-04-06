/**
 * This is the base class for all services that interact with the API system.
 */

import { Validation } from "io-ts";
import * as msRest from "ms-rest-js";
import * as winston from "winston";
import { ReadableReporter } from "../utils/validation_reporters";

const messageErrorOnUnknownResponse = "Unknown response.";
const messageErrorOnApiError = "Api error.";

export default class APIServiceBase {
  protected unknownResponseError(
    // tslint:disable-next-line:no-any
    error: Validation<any>,
    service: string
  ): Error {
    winston.error(
      "Unknown response from %s API: %s",
      service,
      ReadableReporter.report(error)
    );
    return new Error(messageErrorOnUnknownResponse);
  }

  // tslint:disable-next-line:no-any
  protected apiError(error: Validation<any>, service: string): Error {
    winston.error("API error in %s: %s", service, error);
    return new Error(messageErrorOnApiError);
  }

  protected extractBodyFromResponse(
    httpOperationResponse: msRest.HttpOperationResponse
    // tslint:disable-next-line:no-any
  ): any {
    return httpOperationResponse.bodyAsJson;
  }

  // tslint:disable-next-line:no-any
  protected extractStatusFromResponse(
    httpOperationResponse: msRest.HttpOperationResponse
  ): number {
    return httpOperationResponse.response.status;
  }
}
