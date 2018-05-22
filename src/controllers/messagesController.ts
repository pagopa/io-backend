/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import * as express from "express";
import { Either, isLeft, left } from "fp-ts/lib/Either";
import { IResponse } from "../app";
import MessagesService from "../services/messagesService";
import { Messages } from "../types/api/Messages";
import { MessageWithContent } from "../types/api/MessageWithContent";
import { ProblemJson } from "../types/api/ProblemJson";
import { extractUserFromRequest } from "../types/user";

export default class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Returns the messages for the user identified by the provided fiscal
   * code.
   */
  public async getMessagesByUser(
    req: express.Request
  ): Promise<Either<ProblemJson, IResponse<Messages>>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return left({
        status: 500,
        title: error.message
      });
    }

    const user = errorOrUser.value;
    return this.messagesService.getMessagesByUser(user);
  }

  /**
   * Returns the message identified by the message id.
   */
  public async getMessage(
    req: express.Request
  ): Promise<Either<ProblemJson, IResponse<MessageWithContent>>> {
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
    return this.messagesService.getMessage(user, req.params.id);
  }
}
