/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import {
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { ServiceList } from "@generated/backend/ServiceList";
import { ServicePublic as ProxyServicePublic } from "@generated/backend/ServicePublic";
import MessagesService from "../services/messagesService";
import { toHttpError } from "../types/error";
import { extractUserFromRequest } from "../types/user";

export default class ServicesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Returns the service identified by the provided id
   * code.
   */
  public async getService(
    req: express.Request
  ): Promise<MessagesResponse<ProxyServicePublic>> {
    // TODO: validate req.params.id
    const errorOrService = await this.messagesService.getService(req.params.id);

    if (isLeft(errorOrService)) {
      const error = errorOrService.value;
      return toHttpError(error);
    }

    const service = errorOrService.value;
    return ResponseSuccessJson(service);
  }

  public async getServicesByRecipient(
    req: express.Request
  ): Promise<MessagesResponse<ServiceList>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    // TODO: validate req.params.id
    const user = errorOrUser.value;
    const errorOrServices = await this.messagesService.getServicesByRecipient(
      user
    );

    if (isLeft(errorOrServices)) {
      const error = errorOrServices.value;
      return toHttpError(error);
    }

    const services = errorOrServices.value;
    return ResponseSuccessJson(services);
  }

  public async getVisibleServices(
    _: express.Request
  ): Promise<MessagesResponse<ServiceList>> {
    const errorOrServices = await this.messagesService.getVisibleServices();

    if (isLeft(errorOrServices)) {
      const error = errorOrServices.value;
      return toHttpError(error);
    }

    const services = errorOrServices.value;
    return ResponseSuccessJson(services);
  }
}
