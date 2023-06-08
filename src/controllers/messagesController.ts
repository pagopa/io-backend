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
} from "@pagopa/ts-commons/lib/responses";

import { CreatedMessageWithContentAndAttachments } from "generated/backend/CreatedMessageWithContentAndAttachments";
import {
  IResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as B from "fp-ts/boolean";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import NewMessagesService from "src/services/newMessagesService";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { User, withUserFromRequest } from "../types/user";

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
import { LollipopLocalsType, LollipopRequiredHeaders } from "../types/lollipop";
import { LollipopApiClient } from "../clients/lollipop";
import { ISessionStorage } from "../services/ISessionStorage";
import { extractLollipopLocalsFromLollipopHeaders } from "../utils/lollipop";
import { checkIfLollipopIsEnabled } from "../utils/lollipop";
import { ThirdPartyConfigList } from "src/utils/thirdPartyConfig";

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
    private readonly sessionStorage: ISessionStorage,
    private readonly thirdPartyConfigList: ThirdPartyConfigList
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

  public readonly checkLollipopAndGetLocalsOrDefault = (
    req: express.Request,
    user: User,
    messageId: NonEmptyString
  ) =>
    pipe(
      this.messageService.getThirdPartyMessageFnApp(
        user.fiscal_code,
        messageId
      ),
      TE.bindTo("message"),
      TE.bindW("hasLollipopEnabled", ({ message }) =>
        pipe(
          checkIfLollipopIsEnabled(
            this.thirdPartyConfigList,
            user.fiscal_code,
            message.sender_service_id
          ),
          TE.mapLeft((e) =>
            ResponseErrorInternal(
              `Cannot define if Lollipop is enabled or not: ${e.name} | ${e.message}`
            )
          )
        )
      ),
      TE.bindW("lollipopLocals", ({ hasLollipopEnabled }) =>
        pipe(
          hasLollipopEnabled,
          B.matchW(
            () => TE.of(undefined),
            () =>
              pipe(
                t.exact(LollipopRequiredHeaders).decode(req.headers),
                E.foldW(
                  (e) =>
                    TE.left(
                      ResponseErrorInternal(
                        `Bad request ${errorsToReadableMessages(e).join(" / ")}`
                      )
                    ),
                  (lollipopHeaders) =>
                    pipe(
                      extractLollipopLocalsFromLollipopHeaders(
                        this.lollipopClient,
                        this.sessionStorage,
                        user.fiscal_code,
                        lollipopHeaders
                      ),
                      TE.mapLeft((_) =>
                        ResponseErrorInternal(
                          "Error extracting lollipop locals"
                        )
                      )
                    )
                )
              )
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
            this.checkLollipopAndGetLocalsOrDefault(req, user, messageId),
            TE.chainW(({ message, lollipopLocals }) =>
              TE.tryCatch(
                () =>
                  this.messageService.getThirdPartyMessagePrecondition(
                    message,
                    lollipopLocals as LollipopLocalsType
                  ),
                (_) =>
                  ResponseErrorInternal(
                    "Error getting preconditions from third party service"
                  )
              )
            ),
            TE.toUnion
          )()
      )
    );

  /**
   * Returns the Third Party message identified by the message id.
   */
  public readonly getThirdPartyMessage = (
    req: express.Request
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
            this.checkLollipopAndGetLocalsOrDefault(req, user, messageId),
            TE.chainW(({ message, lollipopLocals }) =>
              TE.tryCatch(
                () =>
                  this.messageService.getThirdPartyMessage(
                    message,
                    lollipopLocals as LollipopLocalsType
                  ),
                (_) =>
                  ResponseErrorInternal(
                    "Error getting message from third party service"
                  )
              )
            ),
            TE.toUnion
          )()
      )
    );

  /**
   * Returns the Third Party message attachments identified by the Third Party message id and the attachment relative url.
   */
  public readonly getThirdPartyMessageAttachment = (
    req: express.Request
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
          this.checkLollipopAndGetLocalsOrDefault(req, user, messageId),
          TE.chainW(({ message, lollipopLocals }) =>
            TE.tryCatch(
              () =>
                this.messageService.getThirdPartyAttachment(
                  message,
                  attachmentUrl,
                  lollipopLocals as LollipopLocalsType
                ),
              (_) =>
                ResponseErrorInternal(
                  "Error getting attachment from third party service"
                )
            )
          ),
          TE.toUnion
        )()
      )
    );
}
