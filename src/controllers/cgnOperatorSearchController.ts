/**
 * This controller handles reading/upserting the user data processing from the
 * app by forwarding the call to the API system.
 */

import { IResponseErrorForbiddenNotAuthorized } from "@pagopa/ts-commons/lib/responses";
import {
  IResponse,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { Card } from "generated/cgn-platform/Card";
import { CountResult } from "generated/io-cgn-operator-search-api/CountResult";
import { DiscountBucketCode } from "generated/io-cgn-operator-search-api/DiscountBucketCode";
import { SearchResult } from "generated/io-cgn-operator-search-api/SearchResult";
import CgnService from "src/services/cgnService";

import { Merchant } from "../../generated/cgn-operator-search-platform/Merchant";
import { OfflineMerchants } from "../../generated/cgn-operator-search-platform/OfflineMerchants";
import { OnlineMerchants } from "../../generated/cgn-operator-search-platform/OnlineMerchants";
import { PublishedProductCategoriesResult } from "../../generated/cgn-operator-search-platform/PublishedProductCategoriesResult";
import { OfflineMerchantSearchRequest } from "../../generated/io-cgn-operator-search-api/OfflineMerchantSearchRequest";
import { OnlineMerchantSearchRequest } from "../../generated/io-cgn-operator-search-api/OnlineMerchantSearchRequest";
import { SearchRequest } from "../../generated/io-cgn-operator-search-api/SearchRequest";
import { GetPublishedCategoriesParameters } from "../../generated/parameters/GetPublishedCategoriesParameters";
import CgnOperatorSearchService from "../services/cgnOperatorSearchService";
import { User, withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";

export default class CgnOperatorSearchController {
  constructor(
    private readonly cgnService: CgnService,
    private readonly cgnOperatorSearchService: CgnOperatorSearchService
  ) {}

  /**
   * Get an array of CGN product categories that have at least a published discount
   */
  public readonly getPublishedProductCategories = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PublishedProductCategoriesResult>
  > =>
    withUserFromRequest(req, async () =>
      withValidatedOrValidationError(
        GetPublishedCategoriesParameters.decode(req.query),
        (params) =>
          this.cgnOperatorSearchService.getPublishedProductCategories(params)
      )
    );

  /**
   * Get the CGN operator/merchant by its identifier.
   */
  public readonly getMerchant = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<Merchant>
  > =>
    withUserFromRequest(req, async (user) => {
      const eligibleUserOrErrorResult = await this.eligibleUserOrError(user);
      if (E.isLeft(eligibleUserOrErrorResult)) {
        return eligibleUserOrErrorResult.left;
      }

      return withValidatedOrValidationError(
        NonEmptyString.decode(req.params.merchantId),
        (merchantId) => this.cgnOperatorSearchService.getMerchant(merchantId)
      );
    });

  /**
   * Count CGN merchants/discounts
   */
  public readonly count = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<CountResult>
  > =>
    withUserFromRequest(req, async () => this.cgnOperatorSearchService.count());

  /**
   * Search CGN merchants/discounts that matches with search criteria
   */
  public readonly search = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<SearchResult>
  > =>
    withUserFromRequest(req, async () =>
      withValidatedOrValidationError(
        SearchRequest.decode(req.body),
        (searchRequest) => this.cgnOperatorSearchService.search(searchRequest)
      )
    );

  /**
   * Get an array of CGN online merchants that matches with search criteria
   * expressed in OnlineMerchantSearchRequest
   */
  public readonly getOnlineMerchants = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<OnlineMerchants>
  > =>
    withUserFromRequest(req, async () =>
      withValidatedOrValidationError(
        OnlineMerchantSearchRequest.decode(req.body),
        (onlineSearchRequest) =>
          this.cgnOperatorSearchService.getOnlineMerchants(onlineSearchRequest)
      )
    );

  /**
   * Get an array of CGN offline merchants that matches with search criteria
   * expressed in OfflineMerchantSearchRequest
   */
  public readonly getOfflineMerchants = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<OfflineMerchants>
  > =>
    withUserFromRequest(req, async () =>
      withValidatedOrValidationError(
        OfflineMerchantSearchRequest.decode(req.body),
        (offlineSearchRequest) =>
          this.cgnOperatorSearchService.getOfflineMerchants(
            offlineSearchRequest
          )
      )
    );

  /**
   * Get a discount bucket code by discount identifier.
   */
  public readonly getDiscountBucketCode = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<DiscountBucketCode>
  > =>
    withUserFromRequest(req, async (user) => {
      const eligibleUserOrErrorResult = await this.eligibleUserOrError(user);
      if (E.isLeft(eligibleUserOrErrorResult)) {
        return eligibleUserOrErrorResult.left;
      }

      return withValidatedOrValidationError(
        NonEmptyString.decode(req.params.discountId),
        (discountId) =>
          this.cgnOperatorSearchService.getDiscountBucketCode(discountId)
      );
    });

  private readonly isCgnStatusResponseSuccess = (
    res: IResponse<unknown>
  ): res is IResponseSuccessJson<Card> => res.kind === "IResponseSuccessJson";

  private readonly eligibleUserOrError = async (
    user: User
  ): Promise<
    E.Either<
      IResponseErrorInternal | IResponseErrorForbiddenNotAuthorized,
      string
    >
  > => {
    const cgnStatusResponse = await this.cgnService.getCgnStatus(user);

    return pipe(
      cgnStatusResponse,
      E.fromPredicate(this.isCgnStatusResponseSuccess, () =>
        ResponseErrorInternal("Cannot retrieve cgn card status")
      ),
      E.map((res) => res.value.status),
      E.chainW(
        E.fromPredicate(
          (status) => status === "ACTIVATED",
          () => ResponseErrorForbiddenNotAuthorized
        )
      )
    );
  };
}
