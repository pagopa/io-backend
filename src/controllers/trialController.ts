/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  IResponseSuccessRedirectToResource,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import TrialService from "src/services/trialService";

import { Subscription } from "../../generated/trial-system/Subscription";
import { SubscriptionStateEnum } from "../../generated/trial-system/SubscriptionState";
import { TrialId } from "../../generated/trial-system-api/TrialId";
import {
  FF_IO_WALLET_TRIAL_ENABLED,
  IO_WALLET_TRIAL_ID
} from "../../src/config";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";

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
          // if the trialId is not the one from the wallet, the trial system is always called; otherwise, we check the value of FF_IO_WALLET_TRIAL_ENABLED
          trialId !== IO_WALLET_TRIAL_ID || FF_IO_WALLET_TRIAL_ENABLED
            ? withValidatedOrValidationError(
                NonEmptyString.decode(user.fiscal_code),
                (userId) => this.trialService.getSubscription(userId, trialId)
              )
            : Promise.resolve(
                ResponseSuccessJson({
                  createdAt: new Date(),
                  state: SubscriptionStateEnum.ACTIVE,
                  trialId
                })
              )
      )
    );
}
