/**
 * This service interacts with the GCN operator search API
 */
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ProblemJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { CitizenStatus } from "generated/io-cdc-support-func-api/CitizenStatus";
import { CdcSupportAPIClient } from "src/clients/cdc-support";

import { readableProblem } from "../utils/errorsFormatter";
import {
  ResponseErrorStatusNotDefinedInSpec,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";

type ClientResponses<T> =
  | IResponseType<200, T>
  | IResponseType<404, undefined>
  | IResponseType<500, ProblemJson>;

type ServiceResponses<T> =
  | IResponseErrorInternal
  | IResponseErrorValidation
  | IResponseErrorNotFound
  | IResponseSuccessJson<T>;

export default class CdcSupportService {
  constructor(
    private readonly cdcSupportApiClient: ReturnType<CdcSupportAPIClient>
  ) {}

  public readonly status = (
    fiscalCode: FiscalCode
  ): Promise<ServiceResponses<CitizenStatus>> =>
    withCatchAsInternalError(async () => {
      const validated = await this.cdcSupportApiClient.getStatus({
        body: { fiscal_code: fiscalCode }
      });

      return withValidatedOrInternalError(validated, (response) =>
        this.mapResponse<CitizenStatus>(
          response as ClientResponses<CitizenStatus>
        )
      );
    });

  private readonly mapResponse = <T>(
    response: ClientResponses<T>
  ): ServiceResponses<T> => {
    switch (response.status) {
      case 200:
        return ResponseSuccessJson(response.value);
      case 404:
        return ResponseErrorNotFound("Not Found", "Cdc not found for citizen");
      case 500:
        return ResponseErrorInternal(readableProblem(response.value));
      default:
        return ResponseErrorStatusNotDefinedInSpec(response);
    }
  };
}
