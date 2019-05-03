/**
 * This service retrieves messages from the API system using an API client.
 */

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { CreatedMessageWithContent } from "@generated/backend/CreatedMessageWithContent";
import { PaginatedCreatedMessageWithoutContentCollection } from "@generated/backend/PaginatedCreatedMessageWithoutContentCollection";
import { PaginatedServiceTupleCollection } from "@generated/backend/PaginatedServiceTupleCollection";
import { ServicePublic } from "@generated/backend/ServicePublic";

import { User } from "../types/user";
import {
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

export default class MessagesService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves all messages for a specific user.
   */
  public readonly getMessagesByUser = (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaginatedCreatedMessageWithoutContentCollection>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();
      const validated = await client.getMessages({
        fiscalCode: user.fiscal_code
      });

      return withValidatedOrInternalError(
        validated,
        response =>
          response.status === 200
            ? ResponseSuccessJson(response.value)
            : response.status === 404
              ? ResponseErrorNotFound("Not found", "User not found")
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
    | IResponseSuccessJson<CreatedMessageWithContent>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const res = await client.getMessage({
        fiscalCode: user.fiscal_code,
        id: messageId
      });

      const resMessageContent = res.map(
        _ => (_.status === 200 ? { ..._, value: _.value.message } : _)
      );

      return withValidatedOrInternalError(
        resMessageContent,
        response =>
          response.status === 200
            ? ResponseSuccessJson(response.value)
            : response.status === 404
              ? ResponseErrorNotFound("Not found", "Message not found")
              : unhandledResponseStatus(response.status)
      );
    });

  /**
   * Retrieve all the information about the service that has sent a message.
   */
  public readonly getService = (
    serviceId: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<ServicePublic>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.getService({
        service_id: serviceId
      });

      return withValidatedOrInternalError(
        validated,
        response =>
          response.status === 200
            ? withValidatedOrInternalError(
                ServicePublic.decode(response.value),
                ResponseSuccessJson
              )
            : response.status === 404
              ? ResponseErrorNotFound("Not found", "Service not found")
              : unhandledResponseStatus(response.status)
      );
    });

  public readonly getServicesByRecipient = (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaginatedServiceTupleCollection>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.getServicesByRecipient({
        recipient: user.fiscal_code
      });

      return withValidatedOrInternalError(
        validated,
        response =>
          response.status === 200
            ? withValidatedOrInternalError(
                PaginatedServiceTupleCollection.decode(response.value),
                ResponseSuccessJson
              )
            : unhandledResponseStatus(response.status)
      );
    });

  public readonly getVisibleServices = (): Promise<
    | IResponseErrorInternal
    | IResponseSuccessJson<PaginatedServiceTupleCollection>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.apiClient.getClient();

      const validated = await client.getVisibleServices({});

      return withValidatedOrInternalError(
        validated,
        response =>
          response.status === 200
            ? withValidatedOrInternalError(
                PaginatedServiceTupleCollection.decode(response.value),
                ResponseSuccessJson
              )
            : unhandledResponseStatus(response.status)
      );
    });
}
