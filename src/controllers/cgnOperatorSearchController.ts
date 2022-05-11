/**
 * This controller handles reading/upserting the user data processing from the
 * app by forwarding the call to the API system.
 */

import { IResponseErrorForbiddenNotAuthorized } from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
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
import CgnService from "src/services/cgnService";
import { Either, fromPredicate } from "fp-ts/lib/Either";
import { DiscountBucketCode } from "generated/io-cgn-operator-search-api/DiscountBucketCode";
import { Card } from "generated/cgn/Card";
import { Merchant } from "../../generated/cgn-operator-search/Merchant";
import { OfflineMerchants } from "../../generated/cgn-operator-search/OfflineMerchants";
import { OnlineMerchants } from "../../generated/cgn-operator-search/OnlineMerchants";
import { GetPublishedCategoriesParameters } from "../../generated/parameters/GetPublishedCategoriesParameters";
import { PublishedProductCategoriesResult } from "../../generated/cgn-operator-search/PublishedProductCategoriesResult";
import { OfflineMerchantSearchRequest } from "../../generated/io-cgn-operator-search-api/OfflineMerchantSearchRequest";
import { OnlineMerchantSearchRequest } from "../../generated/io-cgn-operator-search-api/OnlineMerchantSearchRequest";
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
    withUserFromRequest(req, async _ =>
      withValidatedOrValidationError(
        GetPublishedCategoriesParameters.decode(req.query),
        params =>
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
    withUserFromRequest(req, async user => {
      const eligibleUserOrErrorResult = await this.eligibleUserOrError(user);
      if (eligibleUserOrErrorResult.isLeft()) {
        return eligibleUserOrErrorResult.value;
      }

      return withValidatedOrValidationError(
        NonEmptyString.decode(req.params.merchantId),
        merchantId => this.cgnOperatorSearchService.getMerchant(merchantId)
      );
    });

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
    withUserFromRequest(req, async _ =>
      withValidatedOrValidationError(
        OnlineMerchantSearchRequest.decode(req.body),
        onlineSearchRequest =>
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
    withUserFromRequest(req, async _ =>
      withValidatedOrValidationError(
        OfflineMerchantSearchRequest.decode(req.body),
        offlineSearchRequest =>
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
    withUserFromRequest(req, async user => {
      const eligibleUserOrErrorResult = await this.eligibleUserOrError(user);
      if (eligibleUserOrErrorResult.isLeft()) {
        return eligibleUserOrErrorResult.value;
      }

      return withValidatedOrValidationError(
        NonEmptyString.decode(req.params.discountId),
        discountId =>
          this.cgnOperatorSearchService.getDiscountBucketCode(discountId)
      );
    });

  private readonly isCgnStatusResponseSuccess = (
    res: IResponse<unknown>
  ): res is IResponseSuccessJson<Card> => res.kind === "IResponseSuccessJson";

  private readonly eligibleUserOrError = async (
    user: User
  ): Promise<
    Either<
      IResponseErrorInternal | IResponseErrorForbiddenNotAuthorized,
      string
    >
  > => {
    const cgnStatusResponse = await this.cgnService.getCgnStatus(user);

    return fromPredicate<
      IResponseErrorInternal | IResponseErrorForbiddenNotAuthorized,
      IResponse<unknown>,
      IResponseSuccessJson<Card>
    >(this.isCgnStatusResponseSuccess, () =>
      ResponseErrorInternal("Cannot retrieve cgn card status")
    )(cgnStatusResponse)
      .map(res => res.value.status)
      .chain(
        fromPredicate(
          status => status === "ACTIVATED",
          () => ResponseErrorForbiddenNotAuthorized
        )
      );
  };
}
