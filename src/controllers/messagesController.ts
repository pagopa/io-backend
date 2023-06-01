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
  IResponseSuccessNoContent,
  ResponseErrorValidation,
} from "@pagopa/ts-commons/lib/responses";

import { CreatedMessageWithContentAndAttachments } from "generated/backend/CreatedMessageWithContentAndAttachments";
import {
  IResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import * as t from "io-ts";
import { identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import NewMessagesService from "src/services/newMessagesService";
import { withUserFromRequest } from "../types/user";

import { MessageStatusChange } from "../../generated/io-messages-api/MessageStatusChange";
import { MessageStatusAttributes } from "../../generated/io-messages-api/MessageStatusAttributes";
import { PaginatedPublicMessagesCollection } from "../../generated/backend/PaginatedPublicMessagesCollection";
import { GetMessageParameters } from "../../generated/parameters/GetMessageParameters";
import { GetMessagesParameters } from "../../generated/parameters/GetMessagesParameters";
import { ThirdPartyMessagePrecondition } from "../../generated/backend/ThirdPartyMessagePrecondition";
import { ThirdPartyMessageWithContent } from "../../generated/backend/ThirdPartyMessageWithContent";
import {
  withValidatedOrValidationError,
  IResponseSuccessOctet,
  IResponseErrorNotImplemented,
  IResponseErrorUnsupportedMediaType,
} from "../utils/responses";
import { LegalMessageWithContent } from "../../generated/backend/LegalMessageWithContent";
import TokenService from "../services/tokenService";
import { ResLocals } from "src/utils/express";
import {
  LollipopRequiredHeaders,
  withLollipopHeadersFromRequest,
  withLollipopLocals,
} from "src/types/lollipop";
import { LollipopApiClient } from "src/clients/lollipop";
import { ISessionStorage } from "src/services/ISessionStorage";
import { extractLollipopLocalsFromLollipopHeaders } from "src/utils/middleware/lollipop";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";

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
  | IResponseSuccessOctet<Buffer>;

export const withGetThirdPartyAttachmentParams = async <T>(
  req: express.Request,
  f: (id: NonEmptyString, attachment_url: NonEmptyString) => Promise<T>
) =>
  withValidatedOrValidationError(NonEmptyString.decode(req.params.id), (id) =>
    withValidatedOrValidationError(
      NonEmptyString.decode(req.params.attachment_url),
      (attachment_url) => f(id, attachment_url)
    )
  );

export default class MessagesController {
  // eslint-disable-next-line max-params
  constructor(
    private readonly messageService: NewMessagesService,
    private readonly tokenService: TokenService,
    private readonly lollipopClient: ReturnType<typeof LollipopApiClient>,
    private readonly sessionStorage: ISessionStorage
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
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        GetMessagesParameters.decode({
          /* eslint-disable sort-keys */
          pageSize: req.query.page_size,
          enrichResultData: req.query.enrich_result_data,
          getArchivedMessages: req.query.archived,
          maximumId: req.query.maximum_id,
          minimumId: req.query.minimum_id,
          /* eslint-enable sort-keys */
        }),
        (params) => this.messageService.getMessagesByUser(user, params)
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
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        GetMessageParameters.decode({
          id: req.params.id,
          public_message: req.query.public_message,
        }),
        (params) => this.messageService.getMessage(user, params)
      )
    );

  /**
   * Returns the legal message identified by the message id.
   */
  public readonly getLegalMessage = (
    req: express.Request
  ): Promise<IGetLegalMessageResponse> =>
    withUserFromRequest(req, (user) =>
      pipe(
        TE.tryCatch(
          () =>
            this.messageService.getLegalMessage(
              user,
              req.params.id,
              this.tokenService.getPecServerTokenHandler(user.fiscal_code)
            ),
          (e) => ResponseErrorInternal(E.toError(e).message)
        ),
        TE.toUnion
      )()
    );

  /**
   * Returns the legal message attachments identified by the legal message id and the attachment id.
   */
  public readonly getLegalMessageAttachment = (
    req: express.Request
  ): Promise<IGetLegalMessageAttachmentResponse> =>
    withUserFromRequest(req, (user) =>
      pipe(
        TE.tryCatch(
          () =>
            this.messageService.getLegalMessageAttachment(
              user,
              req.params.id,
              this.tokenService.getPecServerTokenHandler(user.fiscal_code),
              req.params.attachment_id
            ),
          (e) => ResponseErrorInternal(E.toError(e).message)
        ),
        TE.toUnion
      )()
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
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        NonEmptyString.decode(req.params.id),
        (messageId) =>
          withValidatedOrValidationError(
            MessageStatusChange.decode(req.body),
            (change) =>
              this.messageService.upsertMessageStatus(
                user.fiscal_code,
                messageId,
                change
              )
          )
      )
    );

  /**
   * Returns the precondition for the required third party message.
   */
  public readonly getThirdPartyMessagePrecondition = async (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessNoContent
    | IResponseSuccessJson<ThirdPartyMessagePrecondition>
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        NonEmptyString.decode(req.params.id),
        (messageId) =>
          pipe(
            TE.of(true), // this will be a task either that will get the message and the service to check if service has lollipo enabled
            TE.chainEitherKW((hasLollipopEnabled) =>
              hasLollipopEnabled
                ? pipe(
                    t.exact(LollipopRequiredHeaders).decode(req.headers),
                    E.map((lollipopHeaders) =>
                      pipe(
                        extractLollipopLocalsFromLollipopHeaders(
                          this.lollipopClient,
                          this.sessionStorage,
                          user,
                          lollipopHeaders
                        ),
                        TE.mapLeft((e) => ResponseErrorInternal(""))
                      )
                    ),
                    E.mapLeft((e) =>
                      ResponseErrorValidation(
                        "Bad request",
                        errorsToReadableMessages(e).join(" / ")
                      )
                    )
                  )
                : E.of(undefined)
            ),
            TE.chainW((x) => (x ? x : TE.of(x))),
            TE.chainW((lollipopLocals) =>
              TE.tryCatch(
                () =>
                  this.messageService.getThirdPartyMessagePrecondition(
                    user.fiscal_code,
                    messageId,
                    lollipopLocals
                  ),
                (_) => ResponseErrorInternal("")
              )
            ),
            TE.toUnion
          )()
      )
    );

  /**
   * Returns the Third Party message identified by the message id.
   */
  public readonly getThirdPartyMessage = <T extends ResLocals>(
    req: express.Request,
    locals?: T
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ThirdPartyMessageWithContent>
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        NonEmptyString.decode(req.params.id),
        (messageId) =>
          pipe(
            locals,
            withLollipopLocals,
            E.map((lollipopLocals) =>
              this.messageService.getThirdPartyMessage(
                user.fiscal_code,
                messageId,
                lollipopLocals
              )
            ),
            E.toUnion
          )
      )
    );

  /**
   * Returns the Third Party message attachments identified by the Third Party message id and the attachment relative url.
   */
  public readonly getThirdPartyMessageAttachment = <T extends ResLocals>(
    req: express.Request,
    locals?: T
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorNotImplemented
    | IResponseErrorUnsupportedMediaType
    | IResponseSuccessOctet<Buffer>
  > =>
    withUserFromRequest(req, (user) =>
      withGetThirdPartyAttachmentParams(req, async (messageId, attachmentUrl) =>
        pipe(
          locals,
          withLollipopLocals,
          E.map((lollipopLocals) =>
            this.messageService.getThirdPartyAttachment(
              user.fiscal_code,
              messageId,
              attachmentUrl,
              lollipopLocals
            )
          ),
          E.toUnion
        )
      )
    );
}
