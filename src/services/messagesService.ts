/**
 * This service retrieves messages from the API system using an API client.
 */

import { Either, left, right } from "fp-ts/lib/Either";
import { IResponseType } from "italia-ts-commons/lib/requests";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { CreatedMessageWithContent } from "../types/api/CreatedMessageWithContent";
import { MessageResponseWithContent } from "../types/api/MessageResponseWithContent";
import { Messages } from "../types/api/Messages";
import { ServicePublic } from "../types/api/ServicePublic";
import { Services } from "../types/api/Services";
import { internalError, notFoundError, ServiceError } from "../types/error";
import { User } from "../types/user";
import { log } from "../utils/logger";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

const messageErrorOnUnknownError = "Unknown response.";
const messageErrorOnApiError = "Api error.";
const messageErrorOnNotFound = "Not found.";
const logErrorOnStatusNotOK = "Status is not 200: %s";
const logErrorOnDecodeError = "Response can't be decoded: %O";
const logErrorOnUnknownError = "Unknown error: %s";
const logErrorOnNotFound = "Not found";

export type MessagesResponse<T> =
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseSuccessJson<T>;

export default class MessagesService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves all messages for a specific user.
   */
  public async getMessagesByUser(
    user: User
  ): Promise<Either<ServiceError, Messages>> {
    try {
      const client = this.apiClient.getClient();

      const res = await client.getMessages({
        fiscalCode: user.fiscal_code
      });

      return this.parseResponse<Messages>(res);
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return left(internalError(messageErrorOnUnknownError));
    }
  }

  /**
   * Retrieves a specific message.
   */
  public async getMessage(
    user: User,
    messageId: string
  ): Promise<Either<ServiceError, CreatedMessageWithContent>> {
    try {
      const client = this.apiClient.getClient();

      const res = await client.getMessage({
        fiscalCode: user.fiscal_code,
        id: messageId
      });

      return this.parseResponse<MessageResponseWithContent>(res).map(
        _ => _.message
      );
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return left(internalError(messageErrorOnUnknownError));
    }
  }

  /**
   * Retrieve all the information about the service that has sent a message.
   */
  public async getService(
    serviceId: string
  ): Promise<Either<ServiceError, ServicePublic>> {
    try {
      const client = this.apiClient.getClient();

      const res = await client.getService({
        id: serviceId
      });

      return this.parseResponse<ServicePublic>(res);
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return left(internalError(messageErrorOnUnknownError));
    }
  }

  public async getServicesByRecipient(
    user: User
  ): Promise<Either<ServiceError, Services>> {
    try {
      const client = this.apiClient.getClient();

      const res = await client.getServicesByRecipient({
        fiscalCode: user.fiscal_code
      });

      return this.parseResponse<Services>(res);
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return left(internalError(messageErrorOnUnknownError));
    }
  }

  public async getVisibleServices(): Promise<Either<ServiceError, Services>> {
    try {
      const client = this.apiClient.getClient();

      const res = await client.getServices();

      return this.parseResponse<Services>(res);
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return left(internalError(messageErrorOnUnknownError));
    }
  }

  private parseResponse<T>(
    res: IResponseType<number, T> | undefined
  ): Either<ServiceError, T> {
    // If the response is undefined (can't be decoded) or the status is not 200 dispatch a failure action.
    if (!res) {
      log.error(logErrorOnDecodeError, res);
      return left<ServiceError, T>(internalError(messageErrorOnApiError));
    }

    if (res.status === 200) {
      return right<ServiceError, T>(res.value);
    } else if (res.status === 404) {
      log.error(logErrorOnNotFound, res.status);
      return left<ServiceError, T>(notFoundError(messageErrorOnNotFound));
    } else {
      log.error(logErrorOnStatusNotOK, res.status);
      return left<ServiceError, T>(internalError(messageErrorOnApiError));
    }
  }
}
