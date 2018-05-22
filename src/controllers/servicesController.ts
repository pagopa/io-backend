/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import * as express from "express";
import { Either, isLeft, left } from "fp-ts/lib/Either";
import { IResponse } from "../app";
import MessagesService from "../services/messagesService";
import { ProblemJson } from "../types/api/ProblemJson";
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
  ): Promise<Either<ProblemJson, IResponse<ProxyServicePublic>>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return left({
        status: 500,
        title: error.message
      });
    }

    // TODO: validate req.params.id
    const user = errorOrUser.value;
    return this.messagesService.getService(user, req.params.id);
  }
}
