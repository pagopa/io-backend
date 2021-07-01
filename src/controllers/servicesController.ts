/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import * as express from "express";
import { ServicePreference } from "generated/backend/ServicePreference";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { IResponseErrorConflict } from "@pagopa/ts-commons/lib/responses";
import { withUserFromRequest } from "../../src/types/user";
import { withValidatedOrValidationError } from "../../src/utils/responses";

import { PaginatedServiceTupleCollection } from "../../generated/backend/PaginatedServiceTupleCollection";
import { ServiceId } from "../../generated/io-api/ServiceId";
import { ServicePublic } from "../../generated/backend/ServicePublic";

import MessagesService from "../services/messagesService";

export default class ServicesController {
  constructor(private readonly messagesService: MessagesService) {}

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
  > => this.messagesService.getService(req.params.id);

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
    withUserFromRequest(req, async user =>
      withValidatedOrValidationError(
        ServiceId.decode(req.params.id),
        serviceId =>
          this.messagesService.getServicePreferences(
            user.fiscal_code,
            serviceId
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
  > => this.messagesService.getVisibleServices();
}
