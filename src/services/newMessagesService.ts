/**
 * This service retrieves messages from the API system using an API client.
 */
import {
  IResponseErrorBadGateway,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorServiceUnavailable,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  IResponseSuccessNoContent,
  ResponseErrorBadGateway,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorServiceTemporarilyUnavailable,
  ResponseErrorTooManyRequests,
  ResponseErrorValidation,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import {
  FiscalCode,
  NonEmptyString,
  Ulid,
} from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { RCConfigurationPublic } from "generated/io-messages-api/RCConfigurationPublic";
import * as t from "io-ts";
import nodeFetch from "node-fetch";
import { AppMessagesAPIClient } from "src/clients/app-messages.client";
import { LollipopLocalsType } from "src/types/lollipop";

import { CreatedMessageWithContentAndAttachments } from "../../generated/backend/CreatedMessageWithContentAndAttachments";
import { InvalidThirdPartyMessageTypeEnum } from "../../generated/backend/InvalidThirdPartyMessageType";
import { MessageBodyMarkdown } from "../../generated/backend/MessageBodyMarkdown";
import { MessageSubject } from "../../generated/backend/MessageSubject";
import { ThirdPartyData } from "../../generated/backend/ThirdPartyData";
import { ThirdPartyMessagePrecondition } from "../../generated/backend/ThirdPartyMessagePrecondition";
import { ThirdPartyMessageWithContent } from "../../generated/backend/ThirdPartyMessageWithContent";
import { CreatedMessageWithContent } from "../../generated/io-messages-api/CreatedMessageWithContent";
import { MessageStatusAttributes } from "../../generated/io-messages-api/MessageStatusAttributes";
import { MessageStatusChange } from "../../generated/io-messages-api/MessageStatusChange";
import { PaginatedPublicMessagesCollection } from "../../generated/io-messages-api/PaginatedPublicMessagesCollection";
import { GetMessageParameters } from "../../generated/parameters/GetMessageParameters";
import { GetMessagesParameters } from "../../generated/parameters/GetMessagesParameters";
import {
  ThirdPartyMessage,
  ThirdPartyMessageDetails,
} from "../../generated/third-party-service/ThirdPartyMessage";
import {
  Fetch,
  getThirdPartyServiceClient,
} from "../clients/third-party-service-client";
import { PN_SERVICE_ID } from "../config";
import { User } from "../types/user";
import { getPrescriptionAttachments } from "../utils/attachments";
import { FileType, getIsFileTypeForTypes } from "../utils/file-type";
import { log } from "../utils/logger";
import {
  IResponseErrorUnsupportedMediaType,
  IResponseSuccessOctet,
  ResponseErrorStatusNotDefinedInSpec,
  ResponseErrorUnexpectedAuthProblem,
  ResponseErrorUnsupportedMediaType,
  ResponseSuccessOctet,
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError,
  wrapValidationWithInternalError,
} from "../utils/responses";

const ALLOWED_TYPES: ReadonlySet<FileType> = new Set(["pdf"]);

const ERROR_MESSAGE_500 = "Third Party Service failed with code 500";
const ERROR_MESSAGE_503 =
  "Third Party Service unavailable with code 503, please retry later";
const ERROR_MESSAGE_400 = "Bad request";

export const MessageWithThirdPartyData = t.intersection([
  CreatedMessageWithContent,
  t.interface({ content: t.interface({ third_party_data: ThirdPartyData }) }),
]);
export type MessageWithThirdPartyData = t.TypeOf<
  typeof MessageWithThirdPartyData
>;

const isMessageWithThirdPartyData = (
  value: CreatedMessageWithContent,
): value is MessageWithThirdPartyData =>
  E.isRight(MessageWithThirdPartyData.decode(value));

export default class NewMessagesService {
  // return an error otherwise
  private readonly getThirdPartyAttachmentFromThirdPartyService = (
    message: MessageWithThirdPartyData,
    attachmentUrl: NonEmptyString,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType,
  ): TE.TaskEither<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorServiceUnavailable
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation,
    Buffer
  > =>
    pipe(
      getThirdPartyServiceClient(
        remoteContentConfiguration,
        nodeFetch as unknown as Fetch,
        lollipopLocals,
      ),
      TE.of,
      TE.map((getClientByFiscalCode) =>
        getClientByFiscalCode(message.fiscal_code),
      ),
      TE.chainW((client) =>
        TE.tryCatch(
          () =>
            client.getThirdPartyMessageAttachment({
              attachment_url: attachmentUrl,
              id: message.content.third_party_data.id,
              ...lollipopLocals,
            }),
          (e) => ResponseErrorInternal(E.toError(e).message),
        ),
      ),
      TE.chainW(wrapValidationWithInternalError),
      TE.chainW(
        flow(
          (response) =>
            response.status === 200 ? E.of(response.value) : E.left(response),
          TE.fromEither,
          TE.mapLeft((response) => {
            log.error(
              `newMessagesService|getThirdPartyAttachmentFromThirdPartyService|invocation returned an error:${
                response.status
              } [title: ${response.value?.title ?? "No title"}, detail: ${
                response.value?.detail ?? "No details"
              }, type: ${response.value?.type ?? "No type"}])`,
            );
            return response;
          }),
          TE.mapLeft(
            flow((response) => {
              switch (response.status) {
                case 400:
                  return ResponseErrorValidation(ERROR_MESSAGE_400, "");
                case 401:
                  return ResponseErrorUnexpectedAuthProblem();
                case 403:
                  return ResponseErrorForbiddenNotAuthorized;
                case 404:
                  return ResponseErrorNotFound(
                    "Not found",
                    "Attachment from Third Party service not found",
                  );
                case 429:
                  return ResponseErrorTooManyRequests();
                case 500:
                  return ResponseErrorInternal(ERROR_MESSAGE_500);
                case 503:
                  // eslint-disable-next-line no-case-declarations
                  const retryAfter = response.headers["Retry-After"] ?? "10";
                  return ResponseErrorServiceTemporarilyUnavailable(
                    ERROR_MESSAGE_503,
                    retryAfter,
                  );
                default:
                  return ResponseErrorStatusNotDefinedInSpec(response);
              }
            }),
          ),
        ),
      ),
    );

  // return an error otherwise
  private readonly getThirdPartyMessageFromThirdPartyService = (
    message: MessageWithThirdPartyData,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType,
  ): TE.TaskEither<
    | IResponseErrorBadGateway
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation,
    ThirdPartyMessage
  > =>
    pipe(
      getThirdPartyServiceClient(
        remoteContentConfiguration,
        nodeFetch as unknown as Fetch,
        lollipopLocals,
      ),
      TE.of,
      TE.map((getClientByFiscalCode) =>
        getClientByFiscalCode(message.fiscal_code),
      ),
      TE.chainW((client) =>
        TE.tryCatch(
          () =>
            client.getThirdPartyMessageDetails({
              id: message.content.third_party_data.id,
              ...lollipopLocals,
            }),
          (e) => ResponseErrorInternal(E.toError(e).message),
        ),
      ),
      TE.chainW(wrapValidationWithInternalError),
      TE.chainW(
        flow(
          (response) =>
            response.status === 200 ? E.of(response.value) : E.left(response),
          TE.fromEither,
          TE.mapLeft((response) => {
            log.error(
              `newMessagesService|getThirdPartyMessageFromThirdPartyService|invocation returned an error:${
                response.status
              } [title: ${response.value?.title ?? "No title"}, detail: ${
                response.value?.detail ?? "No details"
              }, type: ${response.value?.type ?? "No type"}]`,
            );
            return response;
          }),
          TE.mapLeft(
            flow((response) => {
              switch (response.status) {
                case 400:
                  return ResponseErrorValidation(ERROR_MESSAGE_400, "");
                case 401:
                  return ResponseErrorUnexpectedAuthProblem();
                case 403:
                  return ResponseErrorForbiddenNotAuthorized;
                case 404:
                  return ResponseErrorNotFound(
                    "Not found",
                    "Message from Third Party service not found",
                  );
                case 429:
                  return ResponseErrorTooManyRequests();
                case 500:
                  return ResponseErrorInternal(ERROR_MESSAGE_500);
                default:
                  return ResponseErrorStatusNotDefinedInSpec(response);
              }
            }),
          ),
          TE.chainW((response) =>
            this.validateThirdPartyMessageResponse(message, response),
          ),
        ),
      ),
    );

  // return an error otherwise
  private readonly getThirdPartyMessagePreconditionFromThirdPartyService = (
    message: MessageWithThirdPartyData,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType,
  ): TE.TaskEither<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation
    | IResponseSuccessNoContent,
    ThirdPartyMessagePrecondition
  > =>
    pipe(
      getThirdPartyServiceClient(
        remoteContentConfiguration,
        nodeFetch as unknown as Fetch,
        lollipopLocals,
      ),
      TE.of,
      TE.map((getClientByFiscalCode) =>
        getClientByFiscalCode(message.fiscal_code),
      ),
      TE.chain((client) =>
        TE.tryCatch(
          () =>
            client.getThirdPartyMessagePrecondition({
              id: message.content.third_party_data.id,
              ...lollipopLocals,
            }),
          (e) => ResponseErrorInternal(E.toError(e).message),
        ),
      ),
      TE.chainW(wrapValidationWithInternalError),
      TE.chainW(
        flow(
          (response) =>
            response.status === 200 ? E.of(response.value) : E.left(response),
          TE.fromEither,
          TE.mapLeft((response) => {
            log.error(
              `newMessagesService|getThirdPartyMessagePreconditionFromThirdPartyService|invocation returned an error:${
                response.status
              } [title: ${response.value?.title ?? "No title"}, detail: ${
                response.value?.detail ?? "No details"
              }, type: ${response.value?.type ?? "No type"}]`,
            );
            return response;
          }),
          TE.mapLeft(
            flow((response) => {
              switch (response.status) {
                case 400:
                  return ResponseErrorValidation(
                    ERROR_MESSAGE_400,
                    "Third party service returned 400",
                  );
                case 401:
                  return ResponseErrorUnexpectedAuthProblem();
                case 403:
                  return ResponseErrorForbiddenNotAuthorized;
                case 404:
                  return ResponseErrorNotFound(
                    "Not found",
                    "Message from Third Party service not found",
                  );
                case 429:
                  return ResponseErrorTooManyRequests();
                case 500:
                  return ResponseErrorInternal(ERROR_MESSAGE_500);
                default:
                  return ResponseErrorStatusNotDefinedInSpec(response);
              }
            }),
          ),
        ),
      ),
    );

  private readonly validateThirdPartyMessageResponse = (
    message: MessageWithThirdPartyData,
    response: ThirdPartyMessageDetails,
  ): TE.TaskEither<IResponseErrorBadGateway, ThirdPartyMessage> => {
    // PN does not need this validation because it is managed in a different way with different specs
    if (message.sender_service_id === PN_SERVICE_ID) {
      return TE.of(response);
    }
    // if has_attachments is true and there are no attachments in the response than an error must be thrown
    const shouldContainAttachments =
      message.content.third_party_data.has_attachments;
    if (
      shouldContainAttachments &&
      (!response.attachments || response.attachments.length === 0)
    ) {
      return TE.left(
        ResponseErrorBadGateway(
          InvalidThirdPartyMessageTypeEnum.ATTACHMENTS_NOT_PRESENT,
        ),
      );
    }
    // if has_remote_content is true and there is no remote content than an error must be thrown
    const shouldContainRemoteContent =
      message.content.third_party_data.has_remote_content;
    if (shouldContainRemoteContent && !response.details) {
      return TE.left(
        ResponseErrorBadGateway(
          InvalidThirdPartyMessageTypeEnum.REMOTE_CONTENT_NOT_PRESENT,
        ),
      );
    }
    // if has_remote_content is true and the remote markdown is not between 80 and 10000 characters than an error must be throw
    const isMarkdownValid = MessageBodyMarkdown.is(response.details?.markdown);
    if (shouldContainRemoteContent && !isMarkdownValid) {
      return TE.left(
        ResponseErrorBadGateway(
          InvalidThirdPartyMessageTypeEnum.MARKDOWN_VALIDATION_ERROR,
        ),
      );
    }
    // if has_remote_content is true and the remote subject is not between 10 and 121 characters than an error must be throw
    const isSubjectValid = MessageSubject.is(response.details?.subject);
    if (shouldContainRemoteContent && !isSubjectValid) {
      return TE.left(
        ResponseErrorBadGateway(
          InvalidThirdPartyMessageTypeEnum.SUBJECT_VALIDATION_ERROR,
        ),
      );
    }
    // return a validated response by checking the flags
    // if the flag has_attachments is false than the third party is not allowed to send attachments so they will be removed if present
    // if the flag has_remote_content is false than the third party is not allowed to send remote subject and markdown
    // and they will be replaced with the static one sent during the message creation
    return TE.of({
      attachments: shouldContainAttachments ? response.attachments : [],
      details: shouldContainRemoteContent
        ? response.details
        : {
            ...response.details,
            markdown: message.content.markdown,
            subject: message.content.subject,
          },
    });
  };

  // ------------------------------
  // THIRD_PARTY MESSAGE
  // ------------------------------

  /**
   * Retrieves a specific message.
   */
  public readonly getMessage = async (
    user: User,
    params: GetMessageParameters,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<CreatedMessageWithContentAndAttachments>
  > =>
    withCatchAsInternalError(async () => {
      const res = await this.apiClient.getMessage({
        fiscal_code: user.fiscal_code,
        id: params.id,
        public_message: params.public_message,
      });

      const resMessageContent = pipe(
        res,
        E.map((_) => (_.status === 200 ? { ..._, value: _.value.message } : _)),
      );

      return withValidatedOrInternalError(
        resMessageContent,
        async (response) => {
          if (response.status === 200) {
            const messageWithContent = response.value;
            const maybePrescriptionData = O.fromNullable(
              messageWithContent.content.prescription_data,
            );

            return O.isNone(maybePrescriptionData)
              ? ResponseSuccessJson(messageWithContent)
              : pipe(
                  getPrescriptionAttachments(maybePrescriptionData.value),
                  T.map((attachments) => ({
                    ...messageWithContent,
                    content: {
                      ...messageWithContent.content,
                      attachments,
                    },
                  })),
                  T.map(ResponseSuccessJson),
                )();
          }

          return response.status === 404
            ? ResponseErrorNotFound("Not found", "Message not found")
            : response.status === 429
              ? ResponseErrorTooManyRequests()
              : unhandledResponseStatus(response.status);
        },
      );
    });

  /**
   * Retrieves all messages for a specific user.
   */
  public readonly getMessagesByUser = (
    user: User,
    params: GetMessagesParameters,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PaginatedPublicMessagesCollection>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.getMessagesByUser({
        archived: params.getArchivedMessages,
        enrich_result_data: params.enrichResultData,
        /* eslint-disable sort-keys */
        fiscal_code: user.fiscal_code,
        maximum_id: params.maximumId,
        minimum_id: params.minimumId,
        page_size: params.pageSize,
        /* eslint-enable sort-keys */
      });

      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? ResponseSuccessJson(response.value)
          : response.status === 404
            ? ResponseErrorNotFound("Not found", "User not found")
            : response.status === 429
              ? ResponseErrorTooManyRequests()
              : unhandledResponseStatus(response.status),
      );
    });

  public readonly getRCConfiguration = (
    configurationId: Ulid,
  ): TE.TaskEither<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation,
    RCConfigurationPublic
  > =>
    pipe(
      TE.tryCatch(
        () =>
          this.apiClient.getRCConfiguration({
            id: configurationId,
          }),
        (e) => ResponseErrorInternal(E.toError(e).message),
      ),
      TE.chain(wrapValidationWithInternalError),

      TE.chainW(
        flow(
          (response) =>
            response.status === 200 ? E.of(response.value) : E.left(response),
          TE.fromEither,
          TE.mapLeft((response) => {
            log.error(
              `newMessagesService|getRCConfiguration|result:${
                response.status
              }  [title: ${response.value?.title ?? "No title"}, detail: ${
                response.value?.detail ?? "No detail"
              }, type: ${response.value?.type ?? "No type"}]`,
            );
            return response;
          }),
          TE.mapLeft((response) => {
            switch (response.status) {
              case 401:
                return ResponseErrorUnexpectedAuthProblem();
              case 404:
                return ResponseErrorNotFound(
                  "Not found",
                  "RC Configuration not found",
                );
              case 429:
                return ResponseErrorTooManyRequests();
              default:
                return ResponseErrorStatusNotDefinedInSpec(response);
            }
          }),
        ),
      ),
    );

  /**
   * Retrieves an attachment related to a message
   */
  public readonly getThirdPartyAttachment = async (
    message: MessageWithThirdPartyData,
    attachmentUrl: NonEmptyString,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType,
  ): Promise<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorServiceUnavailable
    | IResponseErrorTooManyRequests
    | IResponseErrorUnsupportedMediaType
    | IResponseErrorValidation
    | IResponseSuccessOctet<Buffer>
  > =>
    pipe(
      pipe(
        this.getThirdPartyAttachmentFromThirdPartyService(
          message,
          attachmentUrl,
          remoteContentConfiguration,
          lollipopLocals,
        ),
      ),
      TE.filterOrElseW(getIsFileTypeForTypes(ALLOWED_TYPES), () =>
        ResponseErrorUnsupportedMediaType(
          "The requested file is not a valid PDF",
        ),
      ),
      TE.map(ResponseSuccessOctet),
      TE.toUnion,
    )();

  /**
   * Retrieves a specific Third-Party message.
   */
  public readonly getThirdPartyMessage = async (
    message: MessageWithThirdPartyData,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType,
  ): Promise<
    | IResponseErrorBadGateway
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation
    | IResponseSuccessJson<ThirdPartyMessageWithContent>
  > =>
    pipe(
      pipe(
        this.getThirdPartyMessageFromThirdPartyService(
          message,
          remoteContentConfiguration,
          lollipopLocals,
        ),
        TE.map((thirdPartyMessage) => ({
          ...message,
          third_party_message: thirdPartyMessage,
        })),
      ),
      TE.map(ResponseSuccessJson),
      TE.toUnion,
    )();

  // ------------------------------------
  // Private Functions
  // ------------------------------------

  // Retrieve a ThirdParty message precondition for a specific message, if exists
  public readonly getThirdPartyMessageFnApp = (
    fiscalCode: FiscalCode,
    messageId: Ulid,
  ): TE.TaskEither<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation,
    MessageWithThirdPartyData
  > =>
    pipe(
      TE.tryCatch(
        () =>
          this.apiClient.getMessage({
            fiscal_code: fiscalCode,
            id: messageId,
          }),
        (e) => ResponseErrorInternal(E.toError(e).message),
      ),
      TE.chain(wrapValidationWithInternalError),

      TE.chainW(
        flow(
          (response) =>
            response.status === 200
              ? E.of(response.value.message)
              : E.left(response),
          TE.fromEither,
          TE.mapLeft((response) => {
            log.error(
              `newMessagesService|getThirdPartyMessageFnApp|result:${
                response.status
              }  [title: ${response.value?.title ?? "No title"}, detail: ${
                response.value?.detail ?? "No detail"
              }, type: ${response.value?.type ?? "No type"}]`,
            );
            return response;
          }),
          TE.mapLeft((response) => {
            switch (response.status) {
              case 401:
                return ResponseErrorUnexpectedAuthProblem();
              case 404:
                return ResponseErrorNotFound("Not found", "Message not found");
              case 429:
                return ResponseErrorTooManyRequests();
              default:
                return ResponseErrorStatusNotDefinedInSpec(response);
            }
          }),
        ),
      ),
      TE.chainW(
        // MessageWithThirdPartyData.is fails, we need to check the decode instead
        TE.fromPredicate(isMessageWithThirdPartyData, () =>
          ResponseErrorValidation(
            "Bad request",
            "The message retrieved is not a valid message with third-party data",
          ),
        ),
      ),
    );

  // Retrieve a ThirdParty message detail from related service, if exists
  /**
   * Retrieves the precondition of a specific Third-Party message.
   */
  public readonly getThirdPartyMessagePrecondition = async (
    message: MessageWithThirdPartyData,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType,
  ): Promise<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation
    | IResponseSuccessJson<ThirdPartyMessagePrecondition>
    | IResponseSuccessNoContent
  > =>
    pipe(
      this.getThirdPartyMessagePreconditionFromThirdPartyService(
        message,
        remoteContentConfiguration,
        lollipopLocals,
      ),
      TE.map(ResponseSuccessJson),
      TE.toUnion,
    )();

  /**
   * Retrieve the service preferences fot the defined user and service
   */
  public readonly upsertMessageStatus = (
    fiscalCode: FiscalCode,
    messageId: Ulid,
    messageStatusChange: MessageStatusChange,
  ): Promise<
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation
    | IResponseSuccessJson<MessageStatusAttributes>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.upsertMessageStatusAttributes({
        body: messageStatusChange,
        fiscal_code: fiscalCode,
        id: messageId,
      });

      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson({
              is_archived: response.value.is_archived,
              is_read: response.value.is_read,
            });
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 403:
            return ResponseErrorForbiddenNotAuthorized;
          case 404:
            return ResponseErrorNotFound(
              "Not Found",
              "Message status not found",
            );
          case 429:
            return ResponseErrorTooManyRequests();
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  // Retrieve a ThirdParty attachment from related service, if exists
  constructor(
    private readonly apiClient: ReturnType<typeof AppMessagesAPIClient>,
  ) {}
}
