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
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { MessageResponseWithContent } from "generated/io-api/MessageResponseWithContent";
import { identity } from "fp-ts/lib/function";
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
  withValidatedOrInternalError
} from "../utils/responses";
import { ServiceId } from "../../generated/io-api/ServiceId";
import { LegalMessageWithContent } from "../../generated/backend/LegalMessageWithContent";
import { LegalMessage } from "../../generated/pecserver/LegalMessage";
import {
  PEC_SERVER_TOKEN_SECRET,
  PEC_SERVER_TOKEN_ISSUER,
  PEC_SERVER_TOKEN_EXPIRATION
} from "../../src/config";
import { IApiClientFactoryInterface } from "./IApiClientFactory";
import { IPecServerClientFactoryInterface } from "./IPecServerClientFactory";
import TokenService from "./tokenService";

// IResponseType<200, MessageResponseWithContent, never>

const isGetMessageSuccess = (
  res: IResponseType<number, unknown, never>
): res is IResponseType<200, MessageResponseWithContent, never> =>
  res.status === 200;

const isPecServerGetMessageSuccess = (
  res: IResponseType<number, unknown, never>
): res is IResponseType<200, LegalMessage, never> => res.status === 200;

const youShouldNotBeHere = (message?: string) => {
  throw new Error(`You should not be here: ${message}`);
};

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
    messageId: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<LegalMessageWithContent>
  > =>
    withCatchAsInternalError(async () =>
      // Retrieve the requested message from fn-app
      new TE.TaskEither(
        new T.Task(() =>
          this.apiClient.getClient().getMessage({
            fiscal_code: user.fiscal_code,
            id: messageId
          })
        )
          .map(response =>
            response.mapLeft(_ =>
              ResponseErrorInternal("Error decoding getMessage response")
            )
          )
          .map(response =>
            response.map(
              E.fromPredicate(isGetMessageSuccess, e =>
                ResponseErrorInternal(
                  `Error getting the message from getMessage endpoint (received a ${e.status})` // TODO: disjoint the errors
                )
              )
            )
          )
          .map(responseOrError => responseOrError.chain(identity))
          .map(successResponseOrError =>
            successResponseOrError.map(successResponse => successResponse.value)
          )
      )
        .map(messageResponse => messageResponse.message)
        // Check if legal_data is missing
        .chain(maybeMessageWithLegalData =>
          TE.fromEither(
            E.fromOption(
              ResponseErrorInternal(
                "Missing legal_data in the retrieved message"
              )
            )(O.fromNullable(maybeMessageWithLegalData.content.legal_data))
          ).map(legalData => ({
            ...maybeMessageWithLegalData,
            legal_data: legalData
          }))
        )
        // Enrich the message with legal_message retrieved from pec-server
        .chain(message =>
          new TokenService()
            .getPecServerToken(
              message.fiscal_code,
              PEC_SERVER_TOKEN_SECRET,
              PEC_SERVER_TOKEN_EXPIRATION,
              PEC_SERVER_TOKEN_ISSUER
            )
            .mapLeft(e =>
              ResponseErrorInternal(
                `Error computing the PEC Server JWT: ${e.message}`
              )
            )
            .chain(pecServerJwt =>
              new TE.TaskEither(
                new T.Task(() =>
                  this.pecClient.getClient(pecServerJwt).getMessage({
                    id:
                      message.content.legal_data?.message_unique_id ||
                      youShouldNotBeHere(
                        "legal_data esistence has already been checked"
                      )
                  })
                )
                  .map(response =>
                    response.mapLeft(_ =>
                      ResponseErrorInternal(
                        "Error decoding pecServer getMessage response"
                      )
                    )
                  )
                  .map(response =>
                    response.map(
                      E.fromPredicate(isPecServerGetMessageSuccess, e =>
                        ResponseErrorInternal(
                          `Error getting the message from pecServer getMessage endpoint (received a ${e.status})` // TODO: disjoint the errors
                        )
                      )
                    )
                  )
                  .map(responseOrError => responseOrError.chain(identity))
                  .map(successResponseOrError =>
                    successResponseOrError.map(
                      successResponse => successResponse.value
                    )
                  )
              ).map(legalMessageResponse => ({
                ...message,
                legal_message: legalMessageResponse
              }))
            )
        )
        .map(ResponseSuccessJson)
        .fold<
          IResponseErrorInternal | IResponseSuccessJson<LegalMessageWithContent>
        >(identity, identity)
        .run()
    );

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
}
