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
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import MessagesService from "../services/messagesService";
import { withUserFromRequest } from "../types/user";

import { CreatedMessageWithContent } from "../../generated/backend/CreatedMessageWithContent";
import { PaginatedCreatedMessageWithoutContentCollection } from "../../generated/backend/PaginatedCreatedMessageWithoutContentCollection";

export default class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Returns the messages for the user identified by the provided fiscal code.
   */
  public readonly getMessagesByUser = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PaginatedCreatedMessageWithoutContentCollection>
  > => withUserFromRequest(req, this.messagesService.getMessagesByUser);

  /**
   * Returns the message identified by the message id.
   */
  public readonly getMessage = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<CreatedMessageWithContent>
  > =>
    withUserFromRequest(req, user =>
      this.messagesService.getMessage(user, req.params.id)
    );
}
