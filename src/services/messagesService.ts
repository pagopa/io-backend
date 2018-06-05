/**
 * This service retrieves messages from the API system using an API client.
 */

import { isLeft } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
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
import SimpleHttpOperationResponse from "../utils/simpleResponse";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

const messageErrorOnUnknownResponse = "Unknown response.";
const messageErrorOnApiError = "Api error.";
const messageNotFound = "Not found.";

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
  ): Promise<MessagesResponse<Messages>> {
    const response = await this.apiClient
      .getClient(user.tax_code)
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
        return ResponseErrorInternal(messageErrorOnUnknownResponse);
      }

      if (simpleResponse.isNotFound()) {
        return ResponseErrorNotFound(messageNotFound, "");
      } else {
        winston.error("Api error: %s", simpleResponse.parsedBody());
        return ResponseErrorInternal(messageErrorOnApiError);
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
      return ResponseErrorInternal(messageErrorOnUnknownResponse);
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
  ): Promise<MessagesResponse<MessageWithContent>> {
    const response = await this.apiClient
      .getClient(user.tax_code)
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
        return ResponseErrorInternal(messageErrorOnUnknownResponse);
      }

      if (simpleResponse.isNotFound()) {
        return ResponseErrorNotFound(messageNotFound, "");
      } else {
        winston.error("Api error: %s", simpleResponse.parsedBody());
        return ResponseErrorInternal(messageErrorOnApiError);
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
      return ResponseErrorInternal(messageErrorOnUnknownResponse);
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
  ): Promise<MessagesResponse<ProxyServicePublic>> {
    const response = await this.apiClient
      .getClient(user.tax_code)
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
        return ResponseErrorInternal(messageErrorOnUnknownResponse);
      }

      if (simpleResponse.isNotFound()) {
        return ResponseErrorNotFound(messageNotFound, "");
      } else {
        return ResponseErrorInternal(messageErrorOnApiError);
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
      return ResponseErrorInternal(messageErrorOnUnknownResponse);
    }

    const apiService = errorOrApiService.value;
    return ResponseSuccessJson(toAppService(apiService));
  }
}
