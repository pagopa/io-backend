/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import { ResponseErrorInternal } from "italia-ts-commons/lib/responses";
import MessagesService, { messagesResponse } from "../services/messagesService";
import { ServicePublic as ProxyServicePublic } from "../types/api/ServicePublic";
import { extractUserFromRequest } from "../types/user";

export default class ServicesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Returns the service identified by the provided id
   * code.
   */
  public async getService(
    req: express.Request
  ): Promise<messagesResponse<ProxyServicePublic>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    // TODO: validate req.params.id
    const user = errorOrUser.value;
    return this.messagesService.getService(user, req.params.id);
  }
}
