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
import { Messages } from "../types/api/Messages";
import { MessageWithContent } from "../types/api/MessageWithContent";
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
      return error.toHTTPError();
    }

    const profile = errorOrMessages.value;
    return ResponseSuccessJson(profile);
  }

  /**
   * Returns the message identified by the message id.
   */
  public async getMessage(
    req: express.Request
  ): Promise<MessagesResponse<MessageWithContent>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    // TODO: validate req.params.id
    const user = errorOrUser.value;
    return this.messagesService.getMessage(user, req.params.id);
  }
}
