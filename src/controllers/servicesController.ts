/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import { PathTraversalSafePathParam } from "../../generated/backend/PathTraversalSafePathParam";
import { ServicePreference } from "../../generated/backend/ServicePreference";
import { UpsertServicePreference } from "../../generated/backend/UpsertServicePreference";
import { ServicePublic } from "../../generated/services/ServicePublic";
import { withUserFromRequest } from "../../src/types/user";
import { withValidatedOrValidationError } from "../../src/utils/responses";
import FunctionsAppService from "../services/functionAppService";

export default class ServicesController {
  constructor(private readonly fnAppService: FunctionsAppService) {}

  /**
   * Returns the service identified by the provided id
   * code.
   */
  public readonly getService = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ServicePublic>
  > => this.fnAppService.getService(req.params.id);

  /**
   * Returns the service preferences for the provided service id
   */
  public readonly getServicePreferences = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorConflict
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ServicePreference>
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        PathTraversalSafePathParam.decode(req.params.id),
        (serviceId) =>
          this.fnAppService.getServicePreferences(user.fiscal_code, serviceId)
      )
    );

  /**
   * Create or Update the service preferences for the provided service id
   */
  public readonly upsertServicePreferences = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorConflict
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ServicePreference>
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        PathTraversalSafePathParam.decode(req.params.id),
        (serviceId) =>
          withValidatedOrValidationError(
            UpsertServicePreference.decode(req.body),
            (pref) =>
              this.fnAppService.upsertServicePreferences(
                user.fiscal_code,
                serviceId,
                pref
              )
          )
      )
    );
}
