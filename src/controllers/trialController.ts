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
  IResponseSuccessRedirectToResource,
} from "@pagopa/ts-commons/lib/responses";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import TrialService from "src/services/trialService";
import { TrialId } from "../../generated/trial-system-api/TrialId";
import { withUserFromRequest } from "../types/user";

import { withValidatedOrValidationError } from "../utils/responses";
import { Subscription } from "../../generated/trial-system/Subscription";

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
}
