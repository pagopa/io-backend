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
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { CountResult } from "generated/io-cgn-operator-search-api/CountResult";
import { DiscountBucketCode } from "generated/io-cgn-operator-search-api/DiscountBucketCode";
import { PublishedProductCategoriesResult } from "generated/io-cgn-operator-search-api/PublishedProductCategoriesResult";
import { SearchRequest } from "generated/io-cgn-operator-search-api/SearchRequest";
import { SearchResult } from "generated/io-cgn-operator-search-api/SearchResult";
import { GetPublishedCategoriesParameters } from "generated/parameters/GetPublishedCategoriesParameters";

import { Merchant } from "../../generated/cgn-operator-search-platform/Merchant";
import { OfflineMerchants } from "../../generated/cgn-operator-search-platform/OfflineMerchants";
import { OnlineMerchants } from "../../generated/cgn-operator-search-platform/OnlineMerchants";
import { OfflineMerchantSearchRequest } from "../../generated/io-cgn-operator-search-api/OfflineMerchantSearchRequest";
import { OnlineMerchantSearchRequest } from "../../generated/io-cgn-operator-search-api/OnlineMerchantSearchRequest";
import { CgnOperatorSearchAPIClient } from "../../src/clients/cgn-operator-search";
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

export default class CgnService {
  constructor(
    private readonly cgnOperatorSearchApiClient: ReturnType<CgnOperatorSearchAPIClient>
  ) {}

  /**
   * Get an array of CGN product categories that have at least a published discount
   */
  public readonly getPublishedProductCategories = (
    params: GetPublishedCategoriesParameters
  ): Promise<ServiceResponses<PublishedProductCategoriesResult>> =>
    withCatchAsInternalError(async () => {
      const validated =
        await this.cgnOperatorSearchApiClient.getPublishedProductCategories(
          params
        );

      return withValidatedOrInternalError(validated, (response) =>
        this.mapResponse<PublishedProductCategoriesResult>(
          response as ClientResponses<PublishedProductCategoriesResult>
        )
      );
    });

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

      return withValidatedOrInternalError(validated, (response) =>
        this.mapResponse<Merchant>(response as ClientResponses<Merchant>)
      );
    });

  /**
   * Count CGN merchants/discounts
   */
  public readonly count = (): Promise<ServiceResponses<CountResult>> =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnOperatorSearchApiClient.count({});

      return withValidatedOrInternalError(validated, (response) =>
        this.mapResponse<CountResult>(response as ClientResponses<CountResult>)
      );
    });

  /**
   * Search CGN merchants/discounts that matches with search criteria
   */
  public readonly search = (
    searchRequest: SearchRequest
  ): Promise<ServiceResponses<SearchResult>> =>
    withCatchAsInternalError(async () => {
      const validated = await this.cgnOperatorSearchApiClient.search({
        body: searchRequest
      });

      return withValidatedOrInternalError(validated, (response) =>
        this.mapResponse<SearchResult>(
          response as ClientResponses<SearchResult>
        )
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
      const validated =
        await this.cgnOperatorSearchApiClient.getOnlineMerchants({
          body: onlineMerchantSearchRequest
        });

      return withValidatedOrInternalError(validated, (response) =>
        this.mapResponse<OnlineMerchants>(
          response as ClientResponses<OnlineMerchants>
        )
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
      const validated =
        await this.cgnOperatorSearchApiClient.getOfflineMerchants({
          body: offlineMerchantSearchRequest
        });

      return withValidatedOrInternalError(validated, (response) =>
        this.mapResponse<OfflineMerchants>(
          response as ClientResponses<OfflineMerchants>
        )
      );
    });

  /**
   * Get a discount bucket code by discount identifier.
   */
  public readonly getDiscountBucketCode = (
    discountId: NonEmptyString
  ): Promise<ServiceResponses<DiscountBucketCode>> =>
    withCatchAsInternalError(async () => {
      const validated =
        await this.cgnOperatorSearchApiClient.getDiscountBucketCode({
          discountId
        });

      return withValidatedOrInternalError(validated, (response) =>
        this.mapResponse<DiscountBucketCode>(
          response as ClientResponses<DiscountBucketCode>
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
        return ResponseErrorNotFound("Not Found", "Operator Not found");
      case 500:
        return ResponseErrorInternal(readableProblem(response.value));
      default:
        return ResponseErrorStatusNotDefinedInSpec(response);
    }
  };
}
