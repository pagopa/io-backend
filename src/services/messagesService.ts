/**
 * This service retrieves messages from the API system using an API client.
 */

import { isLeft } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import * as winston from "winston";
import { Messages } from "../types/api/Messages";
import { MessageWithContent } from "../types/api/MessageWithContent";
import { ProblemJson } from "../types/api/ProblemJson";
import { ServicePublic as ProxyServicePublic } from "../types/api/ServicePublic";
import { GetMessagesByUserOKResponse } from "../types/api_client/getMessagesByUserOKResponse";
import { MessageResponseWithContent } from "../types/api_client/messageResponseWithContent";
import { ServicePublic as ApiServicePublic } from "../types/api_client/servicePublic";
import {
  toAppMessageWithContent,
  toAppMessageWithoutContent
} from "../types/message";
import { toAppService } from "../types/service";
import { User } from "../types/user";
import {
  IResponseErrorFatal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseErrorFatal,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "../utils/response";
import SimpleHttpOperationResponse from "../utils/simpleResponse";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

const messageErrorOnUnknownResponse = "Unknown response.";
const messageErrorOnApiError = "Api error.";
const messageNotFound = "Not found.";

export type messagesResponse<T> =
  | IResponseErrorFatal
  | IResponseErrorNotFound
  | IResponseSuccessJson<T>;

export default class MessagesService {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Retrieves all messages for a specific user.
   */
  public async getMessagesByUser(
    user: User
  ): Promise<messagesResponse<Messages>> {
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
        return ResponseErrorFatal(messageErrorOnUnknownResponse);
      }

      if (simpleResponse.isNotFound()) {
        return ResponseErrorNotFound(messageNotFound);
      } else {
        winston.error("Api error: %s", simpleResponse.parsedBody());
        return ResponseErrorFatal(messageErrorOnApiError);
      }
    }

    const errorOrApiMessages = GetMessagesByUserOKResponse.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrApiMessages)) {
      winston.error(
        "Unknown response from getMessagesByUser API: %s",
        ReadableReporter.report(errorOrApiMessages)
      );
      return ResponseErrorFatal(messageErrorOnUnknownResponse);
    }

    const apiMessages = errorOrApiMessages.value;

    const appMessages = apiMessages.items.map(toAppMessageWithoutContent);
    return ResponseSuccessJson({
      items: appMessages,
      page_size: apiMessages.pageSize
    });
  }

  /**
   * Retrieves a specific message.
   */
  public async getMessage(
    user: User,
    messageId: string
  ): Promise<messagesResponse<MessageWithContent>> {
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
        return ResponseErrorFatal(messageErrorOnUnknownResponse);
      }

      if (simpleResponse.isNotFound()) {
        return ResponseErrorNotFound(messageNotFound);
      } else {
        winston.error("Api error: %s", simpleResponse.parsedBody());
        return ResponseErrorFatal(messageErrorOnApiError);
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
      return ResponseErrorFatal(messageErrorOnUnknownResponse);
    }

    const apiMessage = errorOrApiMessage.value;
    return ResponseSuccessJson(toAppMessageWithContent(apiMessage));
  }

  /**
   * Retrieve all the information about the service that has sent a message.
   */
  public async getService(
    user: User,
    serviceId: string
  ): Promise<messagesResponse<ProxyServicePublic>> {
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
        return ResponseErrorFatal(messageErrorOnUnknownResponse);
      }

      if (simpleResponse.isNotFound()) {
        return ResponseErrorNotFound(messageNotFound);
      } else {
        return ResponseErrorFatal(messageErrorOnApiError);
      }
    }

    const errorOrApiService = ApiServicePublic.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrApiService)) {
      winston.error(
        "Unknown response from getService API: %s",
        ReadableReporter.report(errorOrApiService)
      );
      return ResponseErrorFatal(messageErrorOnUnknownResponse);
    }

    const apiService = errorOrApiService.value;
    return ResponseSuccessJson(toAppService(apiService));
  }
}
