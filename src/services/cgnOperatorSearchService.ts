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

type ClientResponses<T> =
  | IResponseType<200, T>
  | IResponseType<404, undefined>
  | IResponseType<500, ProblemJson>;

type ServiceResponses<T> =
  | IResponseErrorInternal
  | IResponseErrorValidation
  | IResponseErrorNotFound
  | IResponseSuccessJson<T>;

export default class CgnService {
  constructor(
    private readonly cgnOperatorSearchApiClient: ReturnType<
      CgnOperatorSearchAPIClient
    >
  ) {}

  private readonly mapResponse = <T>(
    response: ClientResponses<T>
  ): ServiceResponses<T> => {
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
  ): Promise<ServiceResponses<Merchant>> =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnOperatorSearchApiClient.getMerchant({
        merchantId
      });

      return withValidatedOrInternalError(validated, response =>
        this.mapResponse<Merchant>(response)
      );
    });

  /**
   * Get an array of CGN online merchants that matches with search criteria
   * expressed in OnlineMerchantSearchRequest
   */
  public readonly getOnlineMerchants = (
    onlineMerchantSearchRequest: OnlineMerchantSearchRequest
  ): Promise<ServiceResponses<OnlineMerchants>> =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnOperatorSearchApiClient.getOnlineMerchants(
        {
          body: onlineMerchantSearchRequest
        }
      );

      return withValidatedOrInternalError(validated, response =>
        this.mapResponse<OnlineMerchants>(response)
      );
    });

  /**
   * Get an array of CGN offline merchants that matches with search criteria
   * expressed in OfflineMerchantSearchRequest
   */
  public readonly getOfflineMerchants = (
    offlineMerchantSearchRequest: OfflineMerchantSearchRequest
  ): Promise<ServiceResponses<OfflineMerchants>> =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnOperatorSearchApiClient.getOfflineMerchants(
        {
          body: offlineMerchantSearchRequest
        }
      );

      return withValidatedOrInternalError(validated, response =>
        this.mapResponse<OfflineMerchants>(response)
      );
    });
}
