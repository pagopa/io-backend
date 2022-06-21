/**
 * This service retrieves messages from the API system using an API client.
 */

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
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";

import { fromNullable } from "fp-ts/lib/Option";
import { AppMessagesAPIClient } from "src/clients/app-messages.client";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";

import { InternalMessageResponseWithContent } from "../../generated/io-messages-api/InternalMessageResponseWithContent";
import { CreatedMessageWithContent } from "../../generated/io-messages-api/CreatedMessageWithContent";
import { LegalData } from "../../generated/io-messages-api/LegalData";
import { LegalMessageWithContent } from "../../generated/backend/LegalMessageWithContent";
import { PaginatedPublicMessagesCollection } from "../../generated/io-messages-api/PaginatedPublicMessagesCollection";
import { GetMessageParameters } from "../../generated/parameters/GetMessageParameters";
import { GetMessagesParameters } from "../../generated/parameters/GetMessagesParameters";

import { CreatedMessageWithContentAndAttachments } from "../../generated/backend/CreatedMessageWithContentAndAttachments";
import { getPrescriptionAttachments } from "../utils/attachments";
import { StrictUTCISODateFromString } from "../utils/date";
import { errorsToError } from "../utils/errorsFormatter";
import { PecBearerGeneratorT } from "../types/token";
import { User } from "../types/user";
import {
  IResponseSuccessOctet,
  ResponseErrorStatusNotDefinedInSpec,
  ResponseErrorUnexpectedAuthProblem,
  ResponseSuccessOctet,
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError,
  wrapValidationWithInternalError
} from "../utils/responses";
import { MessageStatusChange } from "../../generated/io-messages-api/MessageStatusChange";
import { MessageStatusAttributes } from "../../generated/io-messages-api/MessageStatusAttributes";

import { LegalMessage } from "../../generated/pecserver/LegalMessage";
import { IPecServerClientFactoryInterface } from "./IPecServerClientFactory";

const isGetMessageSuccess = (
  res: IResponseType<number, unknown, never>
): res is IResponseType<200, InternalMessageResponseWithContent, never> =>
  res.status === 200;

const isPecServerGetMessageSuccess = (
  res: IResponseType<number, unknown, never>
): res is IResponseType<200, LegalMessage, never> => res.status === 200;

const MessageWithLegalData = t.intersection([
  CreatedMessageWithContent,
  t.interface({ content: t.interface({ legal_data: LegalData }) })
]);
type MessageWithLegalData = t.TypeOf<typeof MessageWithLegalData>;

export default class NewMessagesService {
  constructor(
    private readonly apiClient: ReturnType<typeof AppMessagesAPIClient>,
    private readonly pecClient: IPecServerClientFactoryInterface
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

  // ------------------------------------
  // Legal Messages
  // ------------------------------------

  /**
   * Retrieves a specific legal message.
   */
  public readonly getLegalMessage = (
    user: User,
    messageId: string,
    bearerGenerator: PecBearerGeneratorT
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<LegalMessageWithContent>
  > =>
    pipe(
      this.getLegalMessageFromFnApp(user, messageId),
      TE.chain(message =>
        pipe(
          this.getLegalMessageFromPecServer(message, bearerGenerator),
          TE.chain(legalMessageMetadata =>
            // Decode the timestamp with timezone from string (UTCISODateFromString currently support only Z time)
            pipe(
              TE.fromEither(
                pipe(
                  StrictUTCISODateFromString.decode(
                    legalMessageMetadata.cert_data.data.timestamp
                  ),
                  E.map(timestamp => ({
                    ...legalMessageMetadata,
                    cert_data: {
                      ...legalMessageMetadata.cert_data,
                      data: {
                        ...legalMessageMetadata.cert_data.data,
                        timestamp
                      }
                    }
                  }))
                )
              ),
              TE.mapLeft(errorsToError),
              TE.mapLeft(es => ResponseErrorInternal(es.message))
            )
          ),
          TE.map(legalMessageResponse => ({
            ...message,
            legal_message: legalMessageResponse
          }))
        )
      ),
      TE.map(ResponseSuccessJson),
      TE.toUnion
    )();

  /**
   * Retrieves a specific legal message attachment.
   */
  public readonly getLegalMessageAttachment = (
    user: User,
    messageId: string,
    bearerGenerator: PecBearerGeneratorT,
    attachmentId: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessOctet
  > =>
    pipe(
      this.getLegalMessageFromFnApp(user, messageId),
      TE.map(message => message.content.legal_data),
      TE.chain(messageLegalData =>
        pipe(
          this.pecClient.getClient(
            bearerGenerator,
            messageLegalData.pec_server_service_id
          ),
          TE.mapLeft(e => ResponseErrorInternal(e.message)),
          TE.chain(client =>
            pipe(
              client.getAttachmentBody(
                messageLegalData.message_unique_id,
                attachmentId
              ),
              TE.mapLeft(e => ResponseErrorInternal(e.message))
            )
          )
        )
      ),
      TE.map(ResponseSuccessOctet),
      TE.toUnion
    )();

  // ----------------------------------------------------

  private readonly getLegalMessageFromFnApp = (user: User, messageId: string) =>
    pipe(
      TE.tryCatch(
        () =>
          this.apiClient.getMessage({
            fiscal_code: user.fiscal_code,
            id: messageId
          }),
        e => ResponseErrorInternal(E.toError(e).message)
      ),
      TE.chain(wrapValidationWithInternalError),
      TE.chain(
        TE.fromPredicate(isGetMessageSuccess, e =>
          ResponseErrorInternal(
            `Error getting the message from getMessage endpoint (received a ${e.status})` // IMPROVE ME: disjoint the errors for better monitoring
          )
        )
      ),
      TE.map(successResponse => successResponse.value.message),
      TE.chain(
        TE.fromPredicate(MessageWithLegalData.is, () =>
          ResponseErrorInternal(
            "The message retrieved is not a valid message with legal data"
          )
        )
      )
    );

  private readonly getLegalMessageFromPecServer = (
    message: MessageWithLegalData,
    bearerGenerator: PecBearerGeneratorT
  ): TE.TaskEither<IResponseErrorInternal, LegalMessage> =>
    pipe(
      this.pecClient.getClient(
        bearerGenerator,
        message.content.legal_data.pec_server_service_id
      ),
      TE.mapLeft(e => ResponseErrorInternal(e.message)),
      TE.chain(client =>
        TE.tryCatch(
          () =>
            client.getMessage({
              id: message.content.legal_data.message_unique_id
            }),
          e => ResponseErrorInternal(E.toError(e).message)
        )
      ),
      TE.chain(wrapValidationWithInternalError),
      TE.chain(
        TE.fromPredicate(isPecServerGetMessageSuccess, e =>
          ResponseErrorInternal(
            `Error getting the message from pecServer getMessage endpoint (received a ${e.status})` // IMPROVE ME: disjoint the errors for better monitoring
          )
        )
      ),
      TE.map(successResponse => successResponse.value)
    );
}
