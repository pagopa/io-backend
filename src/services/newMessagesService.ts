/**
 * This service retrieves messages from the API system using an API client.
 */
import * as t from "io-ts";
import nodeFetch from "node-fetch";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorServiceUnavailable,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorNotFound,
  ResponseErrorTooManyRequests,
  ResponseSuccessJson,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseErrorServiceTemporarilyUnavailable,
  IResponseSuccessNoContent,
  ResponseErrorBadGateway,
  IResponseErrorBadGateway,
} from "@pagopa/ts-commons/lib/responses";
import { AppMessagesAPIClient } from "src/clients/app-messages.client";
import {
  FiscalCode,
  NonEmptyString,
  Ulid,
} from "@pagopa/ts-commons/lib/strings";
import { pipe, flow } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as T from "fp-ts/Task";
import { LollipopLocalsType } from "src/types/lollipop";
import { RCConfigurationPublic } from "generated/io-messages-api/RCConfigurationPublic";
import {
  Fetch,
  getThirdPartyServiceClient,
} from "../clients/third-party-service-client";
import { PN_SERVICE_ID } from "../config";
import { MessageSubject } from "../../generated/backend/MessageSubject";
import { InvalidThirdPartyMessageTypeEnum } from "../../generated/backend/InvalidThirdPartyMessageType";
import { CreatedMessageWithContent } from "../../generated/io-messages-api/CreatedMessageWithContent";
import { PaginatedPublicMessagesCollection } from "../../generated/io-messages-api/PaginatedPublicMessagesCollection";
import { GetMessageParameters } from "../../generated/parameters/GetMessageParameters";
import { GetMessagesParameters } from "../../generated/parameters/GetMessagesParameters";
import { ThirdPartyMessageWithContent } from "../../generated/backend/ThirdPartyMessageWithContent";
import { ThirdPartyMessagePrecondition } from "../../generated/backend/ThirdPartyMessagePrecondition";
import { CreatedMessageWithContentAndAttachments } from "../../generated/backend/CreatedMessageWithContentAndAttachments";
import { getPrescriptionAttachments } from "../utils/attachments";
import { User } from "../types/user";
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
import { MessageStatusChange } from "../../generated/io-messages-api/MessageStatusChange";
import { MessageStatusAttributes } from "../../generated/io-messages-api/MessageStatusAttributes";
import {
  ThirdPartyMessage,
  ThirdPartyMessageDetails,
} from "../../generated/third-party-service/ThirdPartyMessage";
import { ThirdPartyData } from "../../generated/backend/ThirdPartyData";
import { log } from "../utils/logger";
import { FileType, getIsFileTypeForTypes } from "../utils/file-type";
import { MessageBodyMarkdown } from "../../generated/backend/MessageBodyMarkdown";

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
  value: CreatedMessageWithContent
): value is MessageWithThirdPartyData =>
  E.isRight(MessageWithThirdPartyData.decode(value));

export default class NewMessagesService {
  constructor(
    private readonly apiClient: ReturnType<typeof AppMessagesAPIClient>
  ) {}

  /**
   * Retrieves all messages for a specific user.
   */
  public readonly getMessagesByUser = (
    user: User,
    params: GetMessagesParameters
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PaginatedPublicMessagesCollection>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.getMessagesByUser({
        /* eslint-disable sort-keys */
        fiscal_code: user.fiscal_code,
        page_size: params.pageSize,
        enrich_result_data: params.enrichResultData,
        archived: params.getArchivedMessages,
        maximum_id: params.maximumId,
        minimum_id: params.minimumId,
        /* eslint-enable sort-keys */
      });

      return withValidatedOrInternalError(validated, (response) =>
        response.status === 200
          ? ResponseSuccessJson(response.value)
          : response.status === 404
          ? ResponseErrorNotFound("Not found", "User not found")
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status)
      );
    });

  /**
   * Retrieves a specific message.
   */
  public readonly getMessage = async (
    user: User,
    params: GetMessageParameters
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
        E.map((_) => (_.status === 200 ? { ..._, value: _.value.message } : _))
      );

      return withValidatedOrInternalError(
        resMessageContent,
        async (response) => {
          if (response.status === 200) {
            const messageWithContent = response.value;
            const maybePrescriptionData = O.fromNullable(
              messageWithContent.content.prescription_data
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
                  T.map(ResponseSuccessJson)
                )();
          }

          return response.status === 404
            ? ResponseErrorNotFound("Not found", "Message not found")
            : response.status === 429
            ? ResponseErrorTooManyRequests()
            : unhandledResponseStatus(response.status);
        }
      );
    });

  /**
   * Retrieve the service preferences fot the defined user and service
   */
  public readonly upsertMessageStatus = (
    fiscalCode: FiscalCode,
    messageId: Ulid,
    messageStatusChange: MessageStatusChange
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<MessageStatusAttributes>
  > =>
    withCatchAsInternalError(async () => {
      const validated = await this.apiClient.upsertMessageStatusAttributes({
        body: messageStatusChange,
        fiscal_code: fiscalCode,
        id: messageId,
      });

      // eslint-disable-next-line sonarjs/no-identical-functions
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
              "Message status not found"
            );
          case 429:
            return ResponseErrorTooManyRequests();
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  // ------------------------------
  // THIRD_PARTY MESSAGE
  // ------------------------------

  /**
   * Retrieves the precondition of a specific Third-Party message.
   */
  public readonly getThirdPartyMessagePrecondition = async (
    message: MessageWithThirdPartyData,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessNoContent
    | IResponseSuccessJson<ThirdPartyMessagePrecondition>
  > =>
    pipe(
      this.getThirdPartyMessagePreconditionFromThirdPartyService(
        message,
        remoteContentConfiguration,
        lollipopLocals
      ),
      TE.map(ResponseSuccessJson),
      TE.toUnion
    )();

  /**
   * Retrieves a specific Third-Party message.
   */
  public readonly getThirdPartyMessage = async (
    message: MessageWithThirdPartyData,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorBadGateway
    | IResponseSuccessJson<ThirdPartyMessageWithContent>
  > =>
    pipe(
      pipe(
        this.getThirdPartyMessageFromThirdPartyService(
          message,
          remoteContentConfiguration,
          lollipopLocals
        ),
        TE.map((thirdPartyMessage) => ({
          ...message,
          third_party_message: thirdPartyMessage,
        }))
      ),
      TE.map(ResponseSuccessJson),
      TE.toUnion
    )();

  /**
   * Retrieves an attachment related to a message
   */
  public readonly getThirdPartyAttachment = async (
    message: MessageWithThirdPartyData,
    attachmentUrl: NonEmptyString,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorServiceUnavailable
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorUnsupportedMediaType
    | IResponseSuccessOctet<Buffer>
  > =>
    pipe(
      pipe(
        this.getThirdPartyAttachmentFromThirdPartyService(
          message,
          attachmentUrl,
          remoteContentConfiguration,
          lollipopLocals
        )
      ),
      TE.filterOrElseW(getIsFileTypeForTypes(ALLOWED_TYPES), () =>
        ResponseErrorUnsupportedMediaType(
          "The requested file is not a valid PDF"
        )
      ),
      TE.map(ResponseSuccessOctet),
      TE.toUnion
    )();

  public readonly getThirdPartyMessageFnApp = (
    fiscalCode: FiscalCode,
    messageId: Ulid
  ): TE.TaskEither<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests,
    MessageWithThirdPartyData
  > =>
    pipe(
      TE.tryCatch(
        () =>
          this.apiClient.getMessage({
            fiscal_code: fiscalCode,
            id: messageId,
          }),
        (e) => ResponseErrorInternal(E.toError(e).message)
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
              }, type: ${response.value?.type ?? "No type"}]`
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
          })
        )
      ),
      TE.chainW(
        // MessageWithThirdPartyData.is fails, we need to check the decode instead
        TE.fromPredicate(isMessageWithThirdPartyData, () =>
          ResponseErrorValidation(
            "Bad request",
            "The message retrieved is not a valid message with third-party data"
          )
        )
      )
    );

  public readonly getRCConfiguration = (
    configurationId: Ulid
  ): TE.TaskEither<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests,
    RCConfigurationPublic
  > =>
    pipe(
      TE.tryCatch(
        () =>
          this.apiClient.getRCConfiguration({
            id: configurationId,
          }),
        (e) => ResponseErrorInternal(E.toError(e).message)
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
              }, type: ${response.value?.type ?? "No type"}]`
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
                  "RC Configuration not found"
                );
              case 429:
                return ResponseErrorTooManyRequests();
              default:
                return ResponseErrorStatusNotDefinedInSpec(response);
            }
          })
        )
      )
    );

  // ------------------------------------
  // Private Functions
  // ------------------------------------

  // Retrieve a ThirdParty message precondition for a specific message, if exists
  // return an error otherwise
  private readonly getThirdPartyMessagePreconditionFromThirdPartyService = (
    message: MessageWithThirdPartyData,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType
  ): TE.TaskEither<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessNoContent,
    ThirdPartyMessagePrecondition
  > =>
    pipe(
      getThirdPartyServiceClient(
        remoteContentConfiguration,
        nodeFetch as unknown as Fetch,
        lollipopLocals
      ),
      TE.of,
      TE.map((getClientByFiscalCode) =>
        getClientByFiscalCode(message.fiscal_code)
      ),
      TE.chain((client) =>
        TE.tryCatch(
          () =>
            client.getThirdPartyMessagePrecondition({
              id: message.content.third_party_data.id,
              ...lollipopLocals,
            }),
          (e) => ResponseErrorInternal(E.toError(e).message)
        )
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
                // eslint-disable-next-line sonarjs/no-duplicate-string
                response.value?.detail ?? "No details"
              }, type: ${response.value?.type ?? "No type"}]`
            );
            return response;
          }),
          TE.mapLeft(
            flow((response) => {
              switch (response.status) {
                case 400:
                  return ResponseErrorValidation(
                    ERROR_MESSAGE_400,
                    "Third party service returned 400"
                  );
                case 401:
                  return ResponseErrorUnexpectedAuthProblem();
                case 403:
                  return ResponseErrorForbiddenNotAuthorized;
                case 404:
                  return ResponseErrorNotFound(
                    "Not found",
                    "Message from Third Party service not found"
                  );
                case 429:
                  return ResponseErrorTooManyRequests();
                case 500:
                  return ResponseErrorInternal(ERROR_MESSAGE_500);
                default:
                  return ResponseErrorStatusNotDefinedInSpec(response);
              }
            })
          )
        )
      )
    );

  // Retrieve a ThirdParty message detail from related service, if exists
  // return an error otherwise
  private readonly getThirdPartyMessageFromThirdPartyService = (
    message: MessageWithThirdPartyData,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType
  ): TE.TaskEither<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorBadGateway,
    ThirdPartyMessage
  > =>
    pipe(
      getThirdPartyServiceClient(
        remoteContentConfiguration,
        nodeFetch as unknown as Fetch,
        lollipopLocals
      ),
      TE.of,
      TE.map((getClientByFiscalCode) =>
        getClientByFiscalCode(message.fiscal_code)
      ),
      TE.chainW((client) =>
        TE.tryCatch(
          () =>
            client.getThirdPartyMessageDetails({
              id: message.content.third_party_data.id,
              ...lollipopLocals,
            }),
          (e) => ResponseErrorInternal(E.toError(e).message)
        )
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
                // eslint-disable-next-line sonarjs/no-duplicate-string
                response.value?.detail ?? "No details"
              }, type: ${response.value?.type ?? "No type"}]`
            );
            return response;
          }),
          TE.mapLeft(
            // eslint-disable-next-line sonarjs/no-identical-functions
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
                    "Message from Third Party service not found"
                  );
                case 429:
                  return ResponseErrorTooManyRequests();
                case 500:
                  return ResponseErrorInternal(ERROR_MESSAGE_500);
                default:
                  return ResponseErrorStatusNotDefinedInSpec(response);
              }
            })
          ),
          TE.chainW((response) =>
            this.validateThirdPartyMessageResponse(message, response)
          )
        )
      )
    );

  private readonly validateThirdPartyMessageResponse = (
    message: MessageWithThirdPartyData,
    response: ThirdPartyMessageDetails
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
          InvalidThirdPartyMessageTypeEnum.ATTACHMENTS_NOT_PRESENT
        )
      );
    }
    // if has_remote_content is true and there is no remote content than an error must be thrown
    const shouldContainRemoteContent =
      message.content.third_party_data.has_remote_content;
    if (shouldContainRemoteContent && !response.details) {
      return TE.left(
        ResponseErrorBadGateway(
          InvalidThirdPartyMessageTypeEnum.REMOTE_CONTENT_NOT_PRESENT
        )
      );
    }
    // if has_remote_content is true and the remote markdown is not between 80 and 10000 characters than an error must be throw
    const isMarkdownValid = MessageBodyMarkdown.is(response.details?.markdown);
    if (shouldContainRemoteContent && !isMarkdownValid) {
      return TE.left(
        ResponseErrorBadGateway(
          InvalidThirdPartyMessageTypeEnum.MARKDOWN_VALIDATION_ERROR
        )
      );
    }
    // if has_remote_content is true and the remote subject is not between 10 and 121 characters than an error must be throw
    const isSubjectValid = MessageSubject.is(response.details?.subject);
    if (shouldContainRemoteContent && !isSubjectValid) {
      return TE.left(
        ResponseErrorBadGateway(
          InvalidThirdPartyMessageTypeEnum.SUBJECT_VALIDATION_ERROR
        )
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

  // Retrieve a ThirdParty attachment from related service, if exists
  // return an error otherwise
  private readonly getThirdPartyAttachmentFromThirdPartyService = (
    message: MessageWithThirdPartyData,
    attachmentUrl: NonEmptyString,
    remoteContentConfiguration: RCConfigurationPublic,
    lollipopLocals?: LollipopLocalsType
  ): TE.TaskEither<
    | IResponseErrorInternal
    | IResponseErrorServiceUnavailable
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests,
    Buffer
  > =>
    pipe(
      getThirdPartyServiceClient(
        remoteContentConfiguration,
        nodeFetch as unknown as Fetch,
        lollipopLocals
      ),
      TE.of,
      TE.map((getClientByFiscalCode) =>
        getClientByFiscalCode(message.fiscal_code)
      ),
      TE.chainW((client) =>
        TE.tryCatch(
          () =>
            client.getThirdPartyMessageAttachment({
              attachment_url: attachmentUrl,
              id: message.content.third_party_data.id,
              ...lollipopLocals,
            }),
          (e) => ResponseErrorInternal(E.toError(e).message)
        )
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
                // eslint-disable-next-line sonarjs/no-duplicate-string
                response.value?.detail ?? "No details"
              }, type: ${response.value?.type ?? "No type"}])`
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
                    "Attachment from Third Party service not found"
                  );
                case 429:
                  return ResponseErrorTooManyRequests();
                case 500:
                  return ResponseErrorInternal(ERROR_MESSAGE_500);
                case 503:
                  const retryAfter = response.headers["Retry-After"] ?? "10";
                  return ResponseErrorServiceTemporarilyUnavailable(
                    ERROR_MESSAGE_503,
                    retryAfter
                  );
                default:
                  return ResponseErrorStatusNotDefinedInSpec(response);
              }
            })
          )
        )
      )
    );
}
