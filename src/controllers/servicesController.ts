/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  IResponseErrorConflict,
} from "@pagopa/ts-commons/lib/responses";
import { ServiceId } from "@pagopa/io-functions-app-sdk/ServiceId";
import { withUserFromRequest } from "../../src/types/user";
import { withValidatedOrValidationError } from "../../src/utils/responses";

import { PaginatedServiceTupleCollection } from "../../generated/backend/PaginatedServiceTupleCollection";
import { ServicePublic } from "../../generated/backend/ServicePublic";
import { ServicePreference } from "../../generated/backend/ServicePreference";
import { UpsertServicePreference } from "../../generated/backend/UpsertServicePreference";

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
        ServiceId.decode(req.params.id),
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
        ServiceId.decode(req.params.id),
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

  /**
   * Get visible services
   *
   * @param _
   * @returns
   */
  public readonly getVisibleServices = (
    _: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PaginatedServiceTupleCollection>
  > => this.fnAppService.getVisibleServices();
}
