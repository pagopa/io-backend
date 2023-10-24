/**
 * This service retrieves messages from the API system using an API client.
 */
import * as t from "io-ts";
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
import { ThirdPartyMessage } from "../../generated/third-party-service/ThirdPartyMessage";
import { ThirdPartyData } from "../../generated/backend/ThirdPartyData";
import { ThirdPartyServiceClientFactory } from "../../src/clients/third-party-service-client";
import { log } from "../utils/logger";
import { FileType, getIsFileTypeForTypes } from "../utils/file-type";

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
    private readonly apiClient: ReturnType<typeof AppMessagesAPIClient>,
    private readonly thirdPartyClientFactory: ThirdPartyServiceClientFactory
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
    lollipopLocals?: LollipopLocalsType
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ThirdPartyMessageWithContent>
  > =>
    pipe(
      pipe(
        this.getThirdPartyMessageFromThirdPartyService(message, lollipopLocals),
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

  // ------------------------------------
  // Private Functions
  // ------------------------------------

  // Retrieve a ThirdParty message precondition for a specific message, if exists
  // return an error otherwise
  private readonly getThirdPartyMessagePreconditionFromThirdPartyService = (
    message: MessageWithThirdPartyData,
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
      this.thirdPartyClientFactory(message.sender_service_id, lollipopLocals),
      TE.fromEither,
      TE.mapLeft((error) => {
        log.error(
          "newMessagesService|getThirdPartyMessagePreconditionFromThirdPartyService|%s",
          error.message
        );
        return ResponseErrorInternal(error.message);
      }),
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
    lollipopLocals?: LollipopLocalsType
  ): TE.TaskEither<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests,
    ThirdPartyMessage
  > =>
    pipe(
      this.thirdPartyClientFactory(message.sender_service_id, lollipopLocals),
      TE.fromEither,
      TE.mapLeft((error) => {
        log.error(
          "newMessagesService|getThirdPartyMessageFromThirdPartyService|%s",
          error.message
        );
        return ResponseErrorInternal(error.message);
      }),
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
          )
        )
      )
    );

  // Retrieve a ThirdParty attachment from related service, if exists
  // return an error otherwise
  private readonly getThirdPartyAttachmentFromThirdPartyService = (
    message: MessageWithThirdPartyData,
    attachmentUrl: NonEmptyString,
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
      this.thirdPartyClientFactory(message.sender_service_id, lollipopLocals),
      TE.fromEither,
      TE.mapLeft((error) => {
        log.error(
          "newMessagesService|getThirdPartyAttachmentFromThirdPartyService|%s",
          error.message
        );
        return ResponseErrorInternal(error.message);
      }),
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
