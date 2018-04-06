/**
 * This service retrieves messages from the API system using an API client.
 */

import { isLeft } from "fp-ts/lib/Either";
import { ProblemJson } from "../types/api/ProblemJson";
import { GetMessagesByUserOKResponse } from "../types/api_client/getMessagesByUserOKResponse";
import { MessageResponseWithContent } from "../types/api_client/messageResponseWithContent";
import { ServicePublic } from "../types/api_client/servicePublic";
import {
  Message,
  Messages,
  toAppMessageWithContent,
  toAppMessageWithoutContent
} from "../types/message";
import { Service, toAppService } from "../types/service";
import { User } from "../types/user";
import { NonNegativeNumber } from "../utils/numbers";
import APIServiceBase from "./APIServiceBase";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

export default class MessagesService extends APIServiceBase {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {
    super();
  }

  /**
   * Retrieves all messages for a specific user.
   */
  public async getMessagesByUser(user: User): Promise<Messages> {
    const httpOperationResponse = await this.apiClient
      .getClient(user.fiscal_code)
      .getMessagesByUserWithHttpOperationResponse();

    const messagesPayload = this.extractBodyFromResponse(httpOperationResponse);
    const status = this.extractStatusFromResponse(httpOperationResponse);

    if (status !== 200) {
      const errorOrProblemJson = ProblemJson.decode(messagesPayload);
      if (isLeft(errorOrProblemJson)) {
        throw this.unknownResponseError(
          errorOrProblemJson,
          "getMessagesByUser"
        );
      }

      if (status !== 404) {
        throw this.apiError(messagesPayload, "getMessagesByUser");
      }

      return {
        items: [],
        pageSize: 0 as NonNegativeNumber
      };
    }

    const errorOrApiMessages = GetMessagesByUserOKResponse.decode(
      messagesPayload
    );
    if (isLeft(errorOrApiMessages)) {
      throw this.unknownResponseError(errorOrApiMessages, "getMessagesByUser");
    }

    const apiMessages = errorOrApiMessages.value;

    const appMessages = apiMessages.items.map(toAppMessageWithoutContent);
    return {
      items: appMessages,
      pageSize: apiMessages.pageSize
    };
  }

  /**
   * Retrieves a specific message.
   */
  public async getMessage(user: User, messageId: string): Promise<Message> {
    const httpOperationResponse = await this.apiClient
      .getClient(user.fiscal_code)
      .getMessageWithHttpOperationResponse(messageId);

    // tslint:disable-next-line:no-any
    const messagePayload = httpOperationResponse.bodyAsJson as any;
    const status = httpOperationResponse.response.status;

    if (status !== 200) {
      const errorOrProblemJson = ProblemJson.decode(messagePayload);
      if (isLeft(errorOrProblemJson)) {
        throw this.unknownResponseError(
          errorOrProblemJson,
          "getMessagesByUser"
        );
      } else {
        throw this.apiError(messagePayload, "getMessagesByUser");
      }
    }

    const errorOrApiMessage = MessageResponseWithContent.decode(messagePayload);
    if (isLeft(errorOrApiMessage)) {
      throw this.unknownResponseError(errorOrApiMessage, "getMessage");
    }

    const apiMessage = errorOrApiMessage.value;
    return toAppMessageWithContent(apiMessage);
  }

  /**
   * Retrieve all the information about the service that has sent a message.
   */
  public async getService(user: User, serviceId: string): Promise<Service> {
    const httpOperationResponse = await this.apiClient
      .getClient(user.fiscal_code)
      .getServiceWithHttpOperationResponse(serviceId);

    // tslint:disable-next-line:no-any
    const servicePayload = httpOperationResponse.bodyAsJson as any;
    const status = httpOperationResponse.response.status;

    if (status !== 200) {
      const errorOrProblemJson = ProblemJson.decode(servicePayload);
      if (isLeft(errorOrProblemJson)) {
        throw this.unknownResponseError(errorOrProblemJson, "getService");
      } else {
        throw this.apiError(servicePayload, "getService");
      }
    }

    const errorOrApiService = ServicePublic.decode(servicePayload);
    if (isLeft(errorOrApiService)) {
      throw this.unknownResponseError(errorOrApiService, "getService");
    }

    const apiService = errorOrApiService.value;
    return toAppService(apiService);
  }
}
