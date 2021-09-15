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
  IResponseSuccessJson,
  ResponseErrorValidation
} from "italia-ts-commons/lib/responses";

import { CreatedMessageWithContentAndAttachments } from "generated/backend/CreatedMessageWithContentAndAttachments";
import MessagesService from "../services/messagesService";
import { withUserFromRequest } from "../types/user";

import { PaginatedCreatedMessageWithoutContentCollection } from "../../generated/backend/PaginatedCreatedMessageWithoutContentCollection";
import { identity } from "fp-ts/lib/function";
import { GetMessagesParameters } from "../types/parameters";

export default class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Returns the messages for the user identified by the provided fiscal code.
   */
  public readonly getMessagesByUser = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PaginatedCreatedMessageWithoutContentCollection>
  > =>
    GetMessagesParameters.decode({
      pageSize: req.query.page_size,
      continuationToken: req.query.continuation_token,
      enrichResultData: req.query.enrich_result_data
    })
      .map(params =>
        withUserFromRequest(req, user =>
          this.messagesService.getMessagesByUser(user, params)
        )
      )
      .fold<
        Promise<
          | IResponseErrorInternal
          | IResponseErrorValidation
          | IResponseErrorNotFound
          | IResponseErrorTooManyRequests
          | IResponseSuccessJson<
              PaginatedCreatedMessageWithoutContentCollection
            >
        >
      >(
        async _ =>
          ResponseErrorValidation("Decode error", "Cannot decode query params"),
        identity
      );

  /**
   * Returns the message identified by the message id.
   */
  public readonly getMessage = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<CreatedMessageWithContentAndAttachments>
  > =>
    withUserFromRequest(req, user =>
      this.messagesService.getMessage(user, req.params.id)
    );
}
