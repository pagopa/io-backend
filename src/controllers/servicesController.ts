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
import MessagesService, { MessagesResponse } from "../services/messagesService";
import { ServicePublic as ProxyServicePublic } from "../types/api/ServicePublic";
import { Services } from "../types/api/Services";
import { VisibleServices } from "../types/api/VisibleServices";
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
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    // TODO: validate req.params.id
    const user = errorOrUser.value;
    const errorOrService = await this.messagesService.getService(
      user,
      req.params.id
    );

    if (isLeft(errorOrService)) {
      const error = errorOrService.value;
      return toHttpError(error);
    }

    const service = errorOrService.value;
    return ResponseSuccessJson(service);
  }

  public async getServicesByRecipient(
    req: express.Request
  ): Promise<MessagesResponse<Services>> {
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
    req: express.Request
  ): Promise<MessagesResponse<VisibleServices>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    const user = errorOrUser.value;
    const errorOrServices = await this.messagesService.getVisibleServices(user);

    if (isLeft(errorOrServices)) {
      const error = errorOrServices.value;
      return toHttpError(error);
    }

    const services = errorOrServices.value;
    return ResponseSuccessJson(services);
  }
}
