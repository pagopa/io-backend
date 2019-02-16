/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import {
  ResponseErrorInternal,
  ResponseSuccessJson
} from "io-ts-commons/lib/responses";
import MessagesService, { MessagesResponse } from "../services/messagesService";
import { CreatedMessageWithContent } from "../types/api/CreatedMessageWithContent";
import { Messages } from "../types/api/Messages";
import { toHttpError } from "../types/error";
import { extractUserFromRequest } from "../types/user";

export default class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Returns the messages for the user identified by the provided fiscal
   * code.
   */
  public async getMessagesByUser(
    req: express.Request
  ): Promise<MessagesResponse<Messages>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    const user = errorOrUser.value;
    const errorOrMessages = await this.messagesService.getMessagesByUser(user);

    if (isLeft(errorOrMessages)) {
      const error = errorOrMessages.value;
      return toHttpError(error);
    }
    const messages = errorOrMessages.value;
    return ResponseSuccessJson(messages);
  }

  /**
   * Returns the message identified by the message id.
   */
  public async getMessage(
    req: express.Request
  ): Promise<MessagesResponse<CreatedMessageWithContent>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    // TODO: validate req.params.id
    const user = errorOrUser.value;
    const errorOrMessage = await this.messagesService.getMessage(
      user,
      req.params.id
    );

    if (isLeft(errorOrMessage)) {
      const error = errorOrMessage.value;
      return toHttpError(error);
    }

    const message = errorOrMessage.value;
    return ResponseSuccessJson(message);
  }
}
