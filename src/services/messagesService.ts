/**
 * This service retrieves messages from the API system using an API client.
 */

import { isLeft } from "fp-ts/lib/Either";
import { NonNegativeNumber } from "italia-ts-commons/lib/numbers";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import * as winston from "winston";
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
import SimpleHttpOperationResponse from "../utils/simpleResponse";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

const messageErrorOnUnknownResponse = "Unknown response.";
const messageErrorOnApiError = "Api error.";

export default class MessagesService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves all messages for a specific user.
   */
  public async getMessagesByUser(user: User): Promise<Messages> {
    const response = await this.apiClient
      .getClient(user.fiscal_code)
      .getMessagesByUserWithHttpOperationResponse();

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      const errorOrProblemJson = ProblemJson.decode(
        simpleResponse.parsedBody()
      );
      if (isLeft(errorOrProblemJson)) {
        winston.error(
          "Unknown response from getMessagesByUser API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        throw new Error(messageErrorOnUnknownResponse);
      }

      if (!simpleResponse.isNotFound()) {
        throw new Error(messageErrorOnApiError);
      }

      return {
        items: [],
        pageSize: 0 as NonNegativeNumber
      };
    }

    const errorOrApiMessages = GetMessagesByUserOKResponse.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrApiMessages)) {
      winston.error(
        "Unknown response from getMessagesByUser API: %s",
        ReadableReporter.report(errorOrApiMessages)
      );
      throw new Error(messageErrorOnUnknownResponse);
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
    const response = await this.apiClient
      .getClient(user.fiscal_code)
      .getMessageWithHttpOperationResponse(messageId);

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      const errorOrProblemJson = ProblemJson.decode(
        simpleResponse.parsedBody()
      );
      if (isLeft(errorOrProblemJson)) {
        winston.error(
          "Unknown response from getMessage API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        throw new Error(messageErrorOnUnknownResponse);
      } else {
        throw new Error(messageErrorOnApiError);
      }
    }

    const errorOrApiMessage = MessageResponseWithContent.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrApiMessage)) {
      winston.error(
        "Unknown response from getMessage API: %s",
        ReadableReporter.report(errorOrApiMessage)
      );
      throw new Error(messageErrorOnUnknownResponse);
    }

    const apiMessage = errorOrApiMessage.value;
    return toAppMessageWithContent(apiMessage);
  }

  /**
   * Retrieve all the information about the service that has sent a message.
   */
  public async getService(user: User, serviceId: string): Promise<Service> {
    const response = await this.apiClient
      .getClient(user.fiscal_code)
      .getServiceWithHttpOperationResponse(serviceId);

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      const errorOrProblemJson = ProblemJson.decode(
        simpleResponse.parsedBody()
      );
      if (isLeft(errorOrProblemJson)) {
        winston.error(
          "Unknown response from getService API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        throw new Error(messageErrorOnUnknownResponse);
      } else {
        throw new Error(messageErrorOnApiError);
      }
    }

    const errorOrApiService = ServicePublic.decode(simpleResponse.parsedBody());
    if (isLeft(errorOrApiService)) {
      winston.error(
        "Unknown response from getService API: %s",
        ReadableReporter.report(errorOrApiService)
      );
      throw new Error(messageErrorOnUnknownResponse);
    }

    const apiService = errorOrApiService.value;
    return toAppService(apiService);
  }
}
