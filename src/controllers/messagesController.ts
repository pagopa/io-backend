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

import { CreatedMessageWithContentAndAttachments } from "generated/backend/CreatedMessageWithContentAndAttachments";
import MessagesService from "../services/messagesService";
import { withUserFromRequest } from "../types/user";

import { PaginatedPublicMessagesCollection } from "../../generated/backend/PaginatedPublicMessagesCollection";
import { GetMessagesParameters } from "../../generated/backend/GetMessagesParameters";
import {
  withValidatedOrValidationError,
  IResponseSuccessOctet
} from "../utils/responses";
import { LegalMessageWithContent } from "../../generated/backend/LegalMessageWithContent";

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
    | IResponseSuccessJson<PaginatedPublicMessagesCollection>
  > =>
    withUserFromRequest(req, async user =>
      withValidatedOrValidationError(
        GetMessagesParameters.decode({
          /* eslint-disable sort-keys */
          pageSize: req.query.page_size,
          enrichResultData: req.query.enrich_result_data,
          maximumId: req.query.maximum_id,
          minimumId: req.query.minimum_id
          /* eslint-enable sort-keys */
        }),
        params => this.messagesService.getMessagesByUser(user, params)
      )
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

  /**
   * Returns the legal message identified by the message id.
   */
  public readonly getLegalMessage = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<LegalMessageWithContent>
  > =>
    withUserFromRequest(req, user =>
      this.messagesService.getLegalMessage(user, req.params.id)
    );

  /**
   * Returns the legal message attachments identified by the legal message id and the attachment id.
   */
  public readonly getLegalMessageAttachment = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessOctet
  > =>
    withUserFromRequest(req, user =>
      this.messagesService.getLegalMessageAttachment(
        user,
        req.params.legal_message_unique_id,
        req.params.attachment_id
      )
    );
}
