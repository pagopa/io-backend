/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { PaginatedServiceTupleCollection } from "@generated/backend/PaginatedServiceTupleCollection";
import { ServicePublic } from "@generated/backend/ServicePublic";

import { withUserFromRequest } from "src/types/user";
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
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<ServicePublic>
  > => this.messagesService.getService(req.params.id);

  public readonly getServicesByRecipient = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaginatedServiceTupleCollection>
  > =>
    withUserFromRequest(req, user =>
      this.messagesService.getServicesByRecipient(user)
    );

  public readonly getVisibleServices = (
    _: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseSuccessJson<PaginatedServiceTupleCollection>
  > => this.messagesService.getVisibleServices();
}
