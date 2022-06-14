/**
 * This service retrieves messages from the API system using an API client.
 */

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { identity } from "fp-ts/lib/function";

import * as t from "io-ts";

import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorNotFound,
  ResponseErrorTooManyRequests,
  ResponseSuccessJson,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorValidation
} from "@pagopa/ts-commons/lib/responses";

import { fromNullable } from "fp-ts/lib/Option";
import { AppMessagesAPIClient } from "src/clients/app-messages.client";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as T from "fp-ts/Task";
import { PaginatedPublicMessagesCollection } from "../../generated/io-api/PaginatedPublicMessagesCollection";
import { GetMessageParameters } from "../../generated/parameters/GetMessageParameters";
import { GetMessagesParameters } from "../../generated/parameters/GetMessagesParameters";

import { ThirdPartyMessageWithContent } from "../../generated/backend/ThirdPartyMessageWithContent";
import { CreatedMessageWithContentAndAttachments } from "../../generated/backend/CreatedMessageWithContentAndAttachments";
import { getPrescriptionAttachments } from "../utils/attachments";
import { User } from "../types/user";
import {
  ResponseErrorStatusNotDefinedInSpec,
  ResponseErrorUnexpectedAuthProblem,
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError,
  wrapValidationWithInternalError
} from "../utils/responses";
import { MessageStatusChange } from "../../generated/io-messages-api/MessageStatusChange";
import { MessageStatusAttributes } from "../../generated/io-messages-api/MessageStatusAttributes";
import { ThirdPartyMessage } from "../../generated/third-party-service/ThirdPartyMessage";
import { ThirdPartyData } from "../../generated/backend/ThirdPartyData";
import { CreatedMessageWithContent } from "../../generated/backend/CreatedMessageWithContent";
import { MessageResponseWithContent } from "../../generated/io-api/MessageResponseWithContent";

import { ThirdPartyServiceClientFactory } from "../../src/clients/third-party-service-client";
import { log } from "../utils/logger";

const isGetMessageSuccess = <T>(codec: t.Type<T, any>) => (
  res: IResponseType<number, unknown, never>
): res is IResponseType<200, T, never> =>
  res.status === 200 && E.isRight(codec.decode(res.value));

const MessageWithThirdPartyData = t.intersection([
  CreatedMessageWithContent,
  t.interface({ content: t.interface({ third_party_data: ThirdPartyData }) })
]);
type MessageWithThirdPartyData = t.TypeOf<typeof MessageWithThirdPartyData>;

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
        minimum_id: params.minimumId
        /* eslint-enable sort-keys */
      });

      return withValidatedOrInternalError(validated, response =>
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
        public_message: params.public_message
      });

      const resMessageContent = pipe(
        res,
        E.map(_ => (_.status === 200 ? { ..._, value: _.value.message } : _))
      );

      return withValidatedOrInternalError(resMessageContent, async response => {
        if (response.status === 200) {
          const messageWithContent = response.value;
          const maybePrescriptionData = fromNullable(
            messageWithContent.content.prescription_data
          );

          return O.isNone(maybePrescriptionData)
            ? ResponseSuccessJson(messageWithContent)
            : pipe(
                getPrescriptionAttachments(maybePrescriptionData.value),
                T.map(attachments => ({
                  ...messageWithContent,
                  content: {
                    ...messageWithContent.content,
                    attachments
                  }
                })),
                T.map(ResponseSuccessJson)
              )();
        }

        return response.status === 404
          ? ResponseErrorNotFound("Not found", "Message not found")
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status);
      });
    });

  /**
   * Retrieve the service preferences fot the defined user and service
   */
  public readonly upsertMessageStatus = (
    fiscalCode: FiscalCode,
    messageId: NonEmptyString,
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
        id: messageId
      });

      // eslint-disable-next-line sonarjs/no-identical-functions
      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson({
              is_archived: response.value.is_archived,
              is_read: response.value.is_read
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
   * Retrieves a specific Third-Party message.
   */
  public readonly getThirdPartyMessage = async (
    fiscalCode: FiscalCode,
    messageId: NonEmptyString
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ThirdPartyMessageWithContent>
  > =>
    this.getThirdPartyMessageFnApp(fiscalCode, messageId)
      .chain(message =>
        this.getThirdPartyMessageFromThirdPartyService(message).map<
          ThirdPartyMessageWithContent
        >(thirdPartyMessage => ({
          ...message,
          third_party_message: thirdPartyMessage
        }))
      )
      .map(ResponseSuccessJson)
      .fold<
        | IResponseErrorInternal
        | IResponseErrorValidation
        | IResponseErrorForbiddenNotAuthorized
        | IResponseErrorNotFound
        | IResponseErrorTooManyRequests
        | IResponseSuccessJson<ThirdPartyMessageWithContent>
      >(identity, identity)
      .run();

  // ------------------------------------

  private readonly getThirdPartyMessageFnApp = (
    fiscalCode: FiscalCode,
    messageId: string
  ): TE.TaskEither<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests,
    MessageWithThirdPartyData
  > =>
    TE.tryCatch(
      () =>
        this.apiClient.getMessage({
          fiscal_code: fiscalCode,
          id: messageId
        }),
      e =>
        ResponseErrorInternal(E.toError(e).message) as
          | IResponseErrorInternal
          | IResponseErrorValidation
          | IResponseErrorForbiddenNotAuthorized
          | IResponseErrorNotFound
          | IResponseErrorTooManyRequests
    )
      .chain(wrapValidationWithInternalError)
      .chain(
        TE.fromPredicate(
          isGetMessageSuccess(MessageResponseWithContent),
          response => {
            log.error(
              `newMessagesService|getThirdPartyMessageFnApp|result:${
                response.status
              }(${response.value ?? "No details"})`
            );
            return response.status === 404
              ? ResponseErrorNotFound("Not found", "Message not found")
              : response.status === 429
              ? ResponseErrorTooManyRequests()
              : unhandledResponseStatus(response.status);
          }
        )
      )
      .map(successResponse => successResponse.value.message)
      .chain(
        // MessageWithThirdPartyData.is fails, we need to check the decode instead
        TE.fromPredicate(isMessageWithThirdPartyData, () =>
          ResponseErrorInternal(
            "The message retrieved is not a valid message with third-party data"
          )
        )
      );

  // Retrieve a ThirdParty message detail from related service, if exists
  // return an error otherwise
  private readonly getThirdPartyMessageFromThirdPartyService = (
    message: MessageWithThirdPartyData
  ): TE.TaskEither<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests,
    ThirdPartyMessage
  > =>
    TE.fromEither(
      this.thirdPartyClientFactory(message.sender_service_id).mapLeft(e => {
        log.error(
          "newMessagesService|getThirdPartyMessageFromThirdPartyService|%s",
          e
        );
        return ResponseErrorInternal(e.message) as
          | IResponseErrorInternal
          | IResponseErrorValidation
          | IResponseErrorForbiddenNotAuthorized
          | IResponseErrorNotFound
          | IResponseErrorTooManyRequests;
      })
    )
      .map(c => c(message.fiscal_code))
      .chain(client =>
        TE.tryCatch(
          () =>
            client.getThirdPartyMessageDetails({
              id: message.content.third_party_data.id
            }),
          e => ResponseErrorInternal(E.toError(e).message)
        )
      )
      .chain(wrapValidationWithInternalError)
      .chain(
        TE.fromPredicate(isGetMessageSuccess(ThirdPartyMessage), response => {
          log.error(
            `newMessagesService|getThirdPartyMessageFromThirdPartyService|result:${
              response.status
            }(${response.value ?? "No details"})`
          );
          return response.status === 400
            ? ResponseErrorValidation("Bad Request", "")
            : response.status === 401
            ? ResponseErrorUnexpectedAuthProblem()
            : response.status === 403
            ? ResponseErrorForbiddenNotAuthorized
            : response.status === 404
            ? ResponseErrorNotFound("Not found", "Message not found")
            : response.status === 429
            ? ResponseErrorTooManyRequests()
            : unhandledResponseStatus(response.status);
        })
      )
      .map(successResponse => successResponse.value);
}
