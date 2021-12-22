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
import { tryCatch } from "fp-ts/lib/TaskEither";
import { toError } from "fp-ts/lib/Either";
import { ResponseErrorInternal } from "@pagopa/ts-commons/lib/responses";
import { identity } from "fp-ts/lib/function";
import MessagesService from "../services/messagesService";
import { withUserFromRequest } from "../types/user";

import { PaginatedPublicMessagesCollection } from "../../generated/backend/PaginatedPublicMessagesCollection";
import { GetMessagesParameters } from "../../generated/backend/GetMessagesParameters";
import {
  withValidatedOrValidationError,
  IResponseSuccessOctet
} from "../utils/responses";
import { LegalMessageWithContent } from "../../generated/backend/LegalMessageWithContent";
import TokenService from "../services/tokenService";
import { PECSERVER_TOKEN_SECRET } from "../config";

type IGetLegalMessageResponse =
  | IResponseErrorInternal
  | IResponseErrorValidation
  | IResponseErrorNotFound
  | IResponseErrorTooManyRequests
  | IResponseSuccessJson<LegalMessageWithContent>;

type IGetLegalMessageAttachmentResponse =
  | IResponseErrorInternal
  | IResponseErrorValidation
  | IResponseErrorNotFound
  | IResponseErrorTooManyRequests
  | IResponseSuccessOctet;

export default class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly tokenService: TokenService
  ) {}

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
  ): Promise<IGetLegalMessageResponse> =>
    withUserFromRequest(req, user =>
      this.tokenService
        .getPecServerTokenHandler(user.fiscal_code, PECSERVER_TOKEN_SECRET)()
        .mapLeft(e => ResponseErrorInternal(e.message))
        .chain(pecServerJwt =>
          tryCatch(
            () =>
              this.messagesService.getLegalMessage(
                user,
                req.params.id,
                pecServerJwt
              ),
            e => ResponseErrorInternal(toError(e).message)
          )
        )
        .fold<IGetLegalMessageResponse>(identity, identity)
        .run()
    );

  /**
   * Returns the legal message attachments identified by the legal message id and the attachment id.
   */
  public readonly getLegalMessageAttachment = (
    req: express.Request
  ): Promise<IGetLegalMessageAttachmentResponse> =>
    withUserFromRequest(req, user =>
      this.tokenService
        .getPecServerTokenHandler(user.fiscal_code, PECSERVER_TOKEN_SECRET)()
        .mapLeft(e => ResponseErrorInternal(e.message))
        .chain(pecServerJwt =>
          tryCatch(
            () =>
              this.messagesService.getLegalMessageAttachment(
                req.params.legal_message_unique_id,
                req.params.attachment_id,
                pecServerJwt
              ),
            e => ResponseErrorInternal(toError(e).message)
          )
        )
        .fold<IGetLegalMessageAttachmentResponse>(identity, identity)
        .run()
    );
}
