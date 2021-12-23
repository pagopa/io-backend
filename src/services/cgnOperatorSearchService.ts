/**
 * This service interacts with the GCN operator search API
 */
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ProblemJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { Merchant } from "../../generated/cgn-operator-search/Merchant";
import {
  ResponseErrorStatusNotDefinedInSpec,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";
import { readableProblem } from "../utils/errorsFormatter";
import { CgnOperatorSearchAPIClient } from "../../src/clients/cgn-operator-search";
import { OnlineMerchantSearchRequest } from "../../generated/io-cgn-operator-search-api/OnlineMerchantSearchRequest";
import { OnlineMerchants } from "../../generated/cgn-operator-search/OnlineMerchants";
import { OfflineMerchantSearchRequest } from "../../generated/io-cgn-operator-search-api/OfflineMerchantSearchRequest";
import { OfflineMerchants } from "../../generated/cgn-operator-search/OfflineMerchants";
import { IResponseType } from "italia-ts-commons/lib/requests";
export default class CgnService {
  constructor(
    private readonly cgnOperatorSearchApiClient: ReturnType<
      CgnOperatorSearchAPIClient
    >
  ) {}

  private readonly toResponse = <T>(
    response:
      | IResponseType<200, T>
      | IResponseType<404, undefined>
      | IResponseType<500, ProblemJson>
  ):
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<T> => {
    switch (response.status) {
      case 200:
        return ResponseSuccessJson(response.value);
      case 404:
        return ResponseErrorNotFound("Not Found", "Operator Not found");
      case 500:
        return ResponseErrorInternal(readableProblem(response.value));
      default:
        return ResponseErrorStatusNotDefinedInSpec(response);
    }
  };

  /**
   * Get the CGN operator/merchant by its identifier.
   */
  public readonly getMerchant = (
    merchantId: NonEmptyString
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<Merchant>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnOperatorSearchApiClient.getMerchant({
        merchantId
      });

      return withValidatedOrInternalError(validated, response =>
        this.toResponse<Merchant>(response)
      );
    });

  /**
   * Get an array of CGN online merchants that matches with search criteria
   * expressed in OnlineMerchantSearchRequest
   */
  public readonly getOnlineMerchants = (
    onlineMerchantSearchRequest: OnlineMerchantSearchRequest
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseSuccessJson<OnlineMerchants>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnOperatorSearchApiClient.getOnlineMerchants(
        {
          body: onlineMerchantSearchRequest
        }
      );

      return withValidatedOrInternalError(validated, response =>
        this.toResponse<OnlineMerchants>(response)
      );
    });

  /**
   * Get an array of CGN offline merchants that matches with search criteria
   * expressed in OfflineMerchantSearchRequest
   */
  public readonly getOfflineMerchants = (
    offlineMerchantSearchRequest: OfflineMerchantSearchRequest
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseSuccessJson<OfflineMerchants>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnOperatorSearchApiClient.getOfflineMerchants(
        {
          body: offlineMerchantSearchRequest
        }
      );

      return withValidatedOrInternalError(validated, response =>
        this.toResponse<OfflineMerchants>(response)
      );
    });
}
