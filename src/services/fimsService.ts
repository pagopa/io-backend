/**
 * This service interacts with the IO FIMS API
 */

import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  ResponseErrorConflict,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseSuccessAccepted,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import { EmailString, FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { AccessHistoryPage } from "generated/io-fims-api/AccessHistoryPage";
import { ExportRequest } from "generated/io-fims-api/ExportRequest";

import { IoFimsAPIClient } from "../clients/io-fims";

import {
  ResponseErrorStatusNotDefinedInSpec,
  withCatchAsInternalError,
  withValidatedOrInternalError,
} from "../utils/responses";

const invalidRequest = "Invalid request";

export default class FimsService {
  constructor(private readonly ioFimsApiClient: ReturnType<IoFimsAPIClient>) {}

  public readonly getAccessHistory = (
    fiscalCode: FiscalCode,
    page?: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<AccessHistoryPage>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioFimsApiClient.getAccessHistory({
        page,
        user: fiscalCode,
      });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 422:
            return ResponseErrorValidation(
              invalidRequest,
              `An error occurred while validating the request body | ${response.value}`
            );
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  public readonly requestExport = (
    fiscalCode: FiscalCode,
    email: EmailString
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorConflict
    | IResponseErrorValidation
    | IResponseSuccessAccepted<ExportRequest>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.ioFimsApiClient.requestExport({
        body: {
          email,
        },
        user: fiscalCode,
      });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 202:
            return ResponseSuccessAccepted("Export requested", response.value);
          case 409:
            return ResponseErrorConflict(`Export already requested`);
          case 422:
            return ResponseErrorValidation(
              invalidRequest,
              `An error occurred while validating the request body | ${response.value}`
            );
          case 500:
            return ResponseErrorInternal(
              `Internal server error | ${response.value}`
            );
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });
}
