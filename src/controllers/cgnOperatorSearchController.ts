/**
 * This controller handles reading/upserting the user data processing from the
 * app by forwarding the call to the API system.
 */

import { IResponseErrorForbiddenNotAuthorized } from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal
} from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import CgnService from "src/services/cgnService";
import { Either, left, right } from "fp-ts/lib/Either";
import { DiscountBucketCode } from "generated/io-cgn-operator-search-api/DiscountBucketCode";
import { Merchant } from "../../generated/cgn-operator-search/Merchant";
import { OfflineMerchants } from "../../generated/cgn-operator-search/OfflineMerchants";
import { OnlineMerchants } from "../../generated/cgn-operator-search/OnlineMerchants";
import { OfflineMerchantSearchRequest } from "../../generated/io-cgn-operator-search-api/OfflineMerchantSearchRequest";
import { OnlineMerchantSearchRequest } from "../../generated/io-cgn-operator-search-api/OnlineMerchantSearchRequest";
import CgnOperatorSearchService from "../services/cgnOperatorSearchService";
import { User, withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";
import { Card } from "../../generated/io-cgn-api/Card";

export default class CgnOperatorSearchController {
  constructor(
    private readonly cgnService: CgnService,
    private readonly cgnOperatorSearchService: CgnOperatorSearchService
  ) {}

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

  private readonly eligibleUserOrError = async (
    user: User
  ): Promise<
    Either<IResponseErrorInternal | IResponseErrorForbiddenNotAuthorized, void>
  > => {
    const cgnStatusResponse = await this.cgnService.getCgnStatus(user);

    if (cgnStatusResponse.kind !== "IResponseSuccessJson") {
      return left(ResponseErrorInternal("Cannot retrieve cgn card status"));
    }

    const eligible = Card.decode(cgnStatusResponse.value).fold(
      _ => false,
      card => (card.status === "ACTIVATED" ? true : false)
    );

    if (!eligible) {
      return left(ResponseErrorForbiddenNotAuthorized);
    }

    return right(void 0);
  };
}
