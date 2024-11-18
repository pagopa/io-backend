/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import * as express from "express";
import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  IResponseSuccessRedirectToResource,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import TrialService from "src/services/trialService";
import {
  FF_IO_WALLET_TRIAL_ENABLED,
  IO_WALLET_TRIAL_ID,
} from "../../src/config";
import { TrialId } from "../../generated/trial-system-api/TrialId";
import { withUserFromRequest } from "../types/user";

import { withValidatedOrValidationError } from "../utils/responses";
import { Subscription } from "../../generated/trial-system/Subscription";
import { SubscriptionStateEnum } from "../../generated/trial-system/SubscriptionState";

export default class TrialController {
  // eslint-disable-next-line max-params
  constructor(private readonly trialService: TrialService) {}

  public readonly createTrialSubscription = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorConflict
    | IResponseSuccessAccepted
    | IResponseSuccessRedirectToResource<Subscription, Subscription>
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        TrialId.decode(req.params.trialId),
        (trialId) =>
          withValidatedOrValidationError(
            NonEmptyString.decode(user.fiscal_code),
            (userId) => this.trialService.createSubscription(userId, trialId)
          )
      )
    );

  public readonly getTrialSubscription = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<Subscription>
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        TrialId.decode(req.params.trialId),
        (trialId) =>
          FF_IO_WALLET_TRIAL_ENABLED && trialId === IO_WALLET_TRIAL_ID
            ? withValidatedOrValidationError(
                NonEmptyString.decode(user.fiscal_code),
                (userId) => this.trialService.getSubscription(userId, trialId)
              )
            : Promise.resolve(
                ResponseSuccessJson({
                  createdAt: new Date(),
                  state: SubscriptionStateEnum.ACTIVE,
                  trialId,
                })
              )
      )
    );
}
