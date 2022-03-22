/**
 * This service retrieves messages from the API system using an API client.
 */

import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorConflict,
  ResponseErrorNotFound,
  ResponseErrorTooManyRequests,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import { fromNullable } from "fp-ts/lib/Option";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { PaginatedPublicMessagesCollection } from "generated/io-api/PaginatedPublicMessagesCollection";
import { ResponseErrorInternal } from "italia-ts-commons/lib/responses";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { MessageResponseWithContent } from "generated/io-api/MessageResponseWithContent";
import { identity } from "fp-ts/lib/function";
import * as t from "io-ts";
import { PecBearerGeneratorT } from "src/types/token";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { GetMessagesParameters } from "../../generated/backend/GetMessagesParameters";
import { PaginatedServiceTupleCollection } from "../../generated/backend/PaginatedServiceTupleCollection";
import { ServicePublic } from "../../generated/backend/ServicePublic";
import { ServicePreference } from "../../generated/backend/ServicePreference";

import { CreatedMessageWithContentAndAttachments } from "../../generated/backend/CreatedMessageWithContentAndAttachments";
import { getPrescriptionAttachments } from "../../src/utils/attachments";
import { User } from "../types/user";
import {
  ResponseErrorStatusNotDefinedInSpec,
  ResponseErrorUnexpectedAuthProblem,
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError,
  wrapValidationWithInternalError
} from "../utils/responses";
import { ServiceId } from "../../generated/io-api/ServiceId";
import { LegalMessageWithContent } from "../../generated/backend/LegalMessageWithContent";
import { LegalMessage } from "../../generated/pecserver/LegalMessage";
import {
  ResponseSuccessOctet,
  IResponseSuccessOctet
} from "../utils/responses";
import { CreatedMessageWithContent } from "../../generated/io-api/CreatedMessageWithContent";
import { LegalData } from "../../generated/io-api/LegalData";
import { StrictUTCISODateFromString } from "../utils/date";
import { errorsToError } from "../utils/errorsFormatter";
import { MessageStatusChange } from "../../generated/io-api/MessageStatusChange";
import { MessageStatus } from "../../generated/io-api/MessageStatus";
import { IPecServerClientFactoryInterface } from "./IPecServerClientFactory";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

const isGetMessageSuccess = (
  res: IResponseType<number, unknown, never>
): res is IResponseType<200, MessageResponseWithContent, never> =>
  res.status === 200;

const isPecServerGetMessageSuccess = (
  res: IResponseType<number, unknown, never>
): res is IResponseType<200, LegalMessage, never> => res.status === 200;

const MessageWithLegalData = t.intersection([
  CreatedMessageWithContent,
  t.interface({ content: t.interface({ legal_data: LegalData }) })
]);
type MessageWithLegalData = t.TypeOf<typeof MessageWithLegalData>;

export default class MessagesService {
  constructor(
    private readonly apiClient: IApiClientFactoryInterface,
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
      const client = this.apiClient.getClient();
      const validated = await client.getMessagesByUser({
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
  public readonly getMessage = (
    user: User,
    messageId: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<CreatedMessageWithContentAndAttachments>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const res = await client.getMessage({
        fiscal_code: user.fiscal_code,
        id: messageId
      });

      const resMessageContent = res.map(_ =>
        _.status === 200 ? { ..._, value: _.value.message } : _
      );

      return withValidatedOrInternalError(resMessageContent, async response => {
        if (response.status === 200) {
          const maybePrescriptionData = fromNullable(
            response.value.content.prescription_data
          );

          return maybePrescriptionData.isNone()
            ? ResponseSuccessJson(response.value)
            : getPrescriptionAttachments(maybePrescriptionData.value)
                .map(attachments => ({
                  ...response.value,
                  content: {
                    ...response.value.content,
                    attachments
                  }
                }))
                .map(ResponseSuccessJson)
                .run();
        }

        return response.status === 404
          ? ResponseErrorNotFound("Not found", "Message not found")
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status);
      });
    });

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
    this.getLegalMessageFromFnApp(user, messageId)
      .chain(message =>
        this.getLegalMessageFromPecServer(message, bearerGenerator)
          .chain(legalMessageMetadata =>
            // Decode the timestamp with timezone from string (UTCISODateFromString currently support only Z time)
            TE.fromEither(
              StrictUTCISODateFromString.decode(
                legalMessageMetadata.cert_data.data.timestamp
              )
                .map(timestamp => ({
                  ...legalMessageMetadata,
                  cert_data: {
                    ...legalMessageMetadata.cert_data,
                    data: {
                      ...legalMessageMetadata.cert_data.data,
                      timestamp
                    }
                  }
                }))
                .mapLeft(errorsToError)
                .mapLeft(es => ResponseErrorInternal(es.message))
            )
          )
          .map(legalMessageResponse => ({
            ...message,
            legal_message: legalMessageResponse
          }))
      )
      .map(ResponseSuccessJson)
      .fold<
        IResponseErrorInternal | IResponseSuccessJson<LegalMessageWithContent>
      >(identity, identity)
      .run();

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
    this.getLegalMessageFromFnApp(user, messageId)
      .map(message => message.content.legal_data)
      .chain(messageLegalData =>
        this.pecClient
          .getClient(bearerGenerator, messageLegalData.pec_server_service_id)
          .mapLeft(e => ResponseErrorInternal(e.message))
          .chain(client =>
            client
              .getAttachmentBody(
                messageLegalData.message_unique_id,
                attachmentId
              )
              .mapLeft(e => ResponseErrorInternal(e.message))
          )
      )
      .map(ResponseSuccessOctet)
      .fold<IResponseErrorInternal | IResponseSuccessOctet>(identity, identity)
      .run();

  /**
   * Retrieve all the information about the service that has sent a message.
   */
  public readonly getService = (
    serviceId: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ServicePublic>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.getService({
        service_id: serviceId
      });

      return withValidatedOrInternalError(validated, response =>
        response.status === 200
          ? withValidatedOrInternalError(
              ServicePublic.decode(response.value),
              ResponseSuccessJson
            )
          : response.status === 404
          ? ResponseErrorNotFound("Not found", "Service not found")
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status)
      );
    });

  /**
   * Retrieve the service preferences fot the defined user and service
   */
  public readonly getServicePreferences = (
    fiscalCode: FiscalCode,
    serviceId: ServiceId
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseErrorConflict
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ServicePreference>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.getServicePreferences({
        fiscal_code: fiscalCode,
        service_id: serviceId
      });

      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 400:
            return ResponseErrorValidation(
              "Bad Request",
              "Payload has bad format"
            );
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 404:
            return ResponseErrorNotFound(
              "Not Found",
              "User or Service not found"
            );
          case 409:
            return ResponseErrorConflict(
              response.value.detail ??
                "The Profile is not in the correct preference mode"
            );
          case 429:
            return ResponseErrorTooManyRequests();
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  /**
   * Retrieve the service preferences fot the defined user and service
   */
  public readonly upsertServicePreferences = (
    fiscalCode: FiscalCode,
    serviceId: ServiceId,
    servicePreferences: ServicePreference
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseErrorConflict
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ServicePreference>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.upsertServicePreferences({
        body: servicePreferences,
        fiscal_code: fiscalCode,
        service_id: serviceId
      });

      // eslint-disable-next-line sonarjs/no-identical-functions
      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 400:
            return ResponseErrorValidation(
              "Bad Request",
              "Payload has bad format"
            );
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 404:
            return ResponseErrorNotFound(
              "Not Found",
              "User or Service not found"
            );
          case 409:
            return ResponseErrorConflict(
              response.value.detail ??
                "The Profile is not in the correct preference mode"
            );
          case 429:
            return ResponseErrorTooManyRequests();
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  public readonly getVisibleServices = (): Promise<
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PaginatedServiceTupleCollection>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.getVisibleServices({});

      return withValidatedOrInternalError(validated, response =>
        response.status === 200
          ? withValidatedOrInternalError(
              PaginatedServiceTupleCollection.decode(response.value),
              ResponseSuccessJson
            )
          : response.status === 429
          ? ResponseErrorTooManyRequests()
          : unhandledResponseStatus(response.status)
      );
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
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<MessageStatus>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.upsertMessageStatusAttributes({
        body: messageStatusChange,
        fiscal_code: fiscalCode,
        id: messageId
      });

      // eslint-disable-next-line sonarjs/no-identical-functions
      return withValidatedOrInternalError(validated, response => {
        switch (response.status) {
          case 200:
            return ResponseSuccessJson(response.value);
          case 401:
            return ResponseErrorUnexpectedAuthProblem();
          case 404:
            return ResponseErrorNotFound("Not Found", "Message status not found");
          case 429:
            return ResponseErrorTooManyRequests();
          default:
            return ResponseErrorStatusNotDefinedInSpec(response);
        }
      });
    });

  private readonly getLegalMessageFromFnApp = (user: User, messageId: string) =>
    TE.tryCatch(
      () =>
        this.apiClient.getClient().getMessage({
          fiscal_code: user.fiscal_code,
          id: messageId
        }),
      e => ResponseErrorInternal(E.toError(e).message)
    )
      .chain(wrapValidationWithInternalError)
      .chain(
        TE.fromPredicate(isGetMessageSuccess, e =>
          ResponseErrorInternal(
            `Error getting the message from getMessage endpoint (received a ${e.status})` // IMPROVE ME: disjoint the errors for better monitoring
          )
        )
      )
      .map(successResponse => successResponse.value.message)
      .chain(
        TE.fromPredicate(MessageWithLegalData.is, () =>
          ResponseErrorInternal(
            "The message retrieved is not a valid message with legal data"
          )
        )
      );

  private readonly getLegalMessageFromPecServer = (
    message: MessageWithLegalData,
    bearerGenerator: PecBearerGeneratorT
  ): TE.TaskEither<IResponseErrorInternal, LegalMessage> =>
    this.pecClient
      .getClient(
        bearerGenerator,
        message.content.legal_data.pec_server_service_id
      )
      .mapLeft(e => ResponseErrorInternal(e.message))
      .chain(client =>
        TE.tryCatch(
          () =>
            client.getMessage({
              id: message.content.legal_data.message_unique_id
            }),
          e => ResponseErrorInternal(E.toError(e).message)
        )
      )
      .chain(wrapValidationWithInternalError)
      .chain(
        TE.fromPredicate(isPecServerGetMessageSuccess, e =>
          ResponseErrorInternal(
            `Error getting the message from pecServer getMessage endpoint (received a ${e.status})` // IMPROVE ME: disjoint the errors for better monitoring
          )
        )
      )
      .map(successResponse => successResponse.value);
}
