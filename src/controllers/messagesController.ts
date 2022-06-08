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
} from "@pagopa/ts-commons/lib/responses";

import { CreatedMessageWithContentAndAttachments } from "generated/backend/CreatedMessageWithContentAndAttachments";
import { tryCatch } from "fp-ts/lib/TaskEither";
import { toError } from "fp-ts/lib/Either";
import {
  IResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";
import { identity } from "fp-ts/lib/function";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { withUserFromRequest } from "../types/user";

import { MessageStatusChange } from "../../generated/io-api/MessageStatusChange";
import { MessageStatusAttributes } from "../../generated/io-api/MessageStatusAttributes";
import { PaginatedPublicMessagesCollection } from "../../generated/backend/PaginatedPublicMessagesCollection";
import { GetMessageParameters } from "../../generated/parameters/GetMessageParameters";
import { GetMessagesParameters } from "../../generated/parameters/GetMessagesParameters";
import {
  withValidatedOrValidationError,
  IResponseSuccessOctet,
  IResponseErrorNotImplemented,
  ResponseErrorNotImplemented
} from "../utils/responses";
import { LegalMessageWithContent } from "../../generated/backend/LegalMessageWithContent";
import TokenService from "../services/tokenService";
import { MessageServiceSelector } from "../services/messagesServiceSelector";

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
  // eslint-disable-next-line max-params
  constructor(
    private readonly messageServiceSelector: MessageServiceSelector,
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
          getArchivedMessages: req.query.archived,
          maximumId: req.query.maximum_id,
          minimumId: req.query.minimum_id
          /* eslint-enable sort-keys */
        }),
        params =>
          this.messageServiceSelector
            .select(user.fiscal_code)
            .getMessagesByUser(user, params)
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
    withUserFromRequest(req, async user =>
      withValidatedOrValidationError(
        GetMessageParameters.decode({
          id: req.params.id,
          public_message: req.query.public_message
        }),
        params =>
          this.messageServiceSelector
            .select(user.fiscal_code)
            .getMessage(user, params)
      )
    );

  /**
   * Returns the legal message identified by the message id.
   */
  public readonly getLegalMessage = (
    req: express.Request
  ): Promise<IGetLegalMessageResponse> =>
    withUserFromRequest(req, user =>
      tryCatch(
        () =>
          // getLegalMessage is not yet implemented in new fn-app-messages
          // just skip new implementation and take fn-app one
          this.messageServiceSelector
            .getOldMessageService()
            .getLegalMessage(
              user,
              req.params.id,
              this.tokenService.getPecServerTokenHandler(user.fiscal_code)
            ),
        e => ResponseErrorInternal(toError(e).message)
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
      tryCatch(
        () =>
          // getLegalMessageAttachment is not yet implemented in new fn-app-messages
          // just skip new implementation and take fn-app one
          this.messageServiceSelector
            .getOldMessageService()
            .getLegalMessageAttachment(
              user,
              req.params.id,
              this.tokenService.getPecServerTokenHandler(user.fiscal_code),
              req.params.attachment_id
            ),
        e => ResponseErrorInternal(toError(e).message)
      )
        .fold<IGetLegalMessageAttachmentResponse>(identity, identity)
        .run()
    );

  public readonly upsertMessageStatus = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<MessageStatusAttributes>
  > =>
    withUserFromRequest(req, async user =>
      withValidatedOrValidationError(
        NonEmptyString.decode(req.params.id),
        messageId =>
          withValidatedOrValidationError(
            MessageStatusChange.decode(req.body),
            change =>
              this.messageServiceSelector
                .getNewMessageService()
                .upsertMessageStatus(user.fiscal_code, messageId, change)
          )
      )
    );

  /**
   * Returns the Third Party message identified by the message id.
   */
  public readonly getThirdPartyMessage = (
    req: express.Request
  ): Promise<IResponseErrorValidation | IResponseErrorNotImplemented> =>
    withUserFromRequest(req, _user =>
      Promise.resolve(ResponseErrorNotImplemented("Not implemented yet"))
    );

  /**
   * Returns the Third Party message attachments identified by the Third Party message id and the attachment relative url.
   */
  public readonly getThirdPartyMessageAttachment = (
    req: express.Request
    // eslint-disable-next-line sonarjs/no-identical-functions
  ): Promise<IResponseErrorValidation | IResponseErrorNotImplemented> =>
    withUserFromRequest(req, _user =>
      Promise.resolve(ResponseErrorNotImplemented("Not implemented yet"))
    );
}
