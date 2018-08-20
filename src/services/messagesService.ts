/**
 * This service retrieves messages from the API system using an API client.
 */

import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { Messages } from "../types/api/Messages";
import { MessageWithContent } from "../types/api/MessageWithContent";
import { ProblemJson } from "../types/api/ProblemJson";
import { ServiceList } from "../types/api/ServiceList";
import { ServicePublic as ProxyServicePublic } from "../types/api/ServicePublic";
import { GetMessagesByUserOKResponse } from "../types/api_client/getMessagesByUserOKResponse";
import { GetServicesByRecipientOKResponse } from "../types/api_client/getServicesByRecipientOKResponse";
import { GetVisibleServicesOKResponse } from "../types/api_client/getVisibleServicesOKResponse";
import { MessageResponseWithContent } from "../types/api_client/messageResponseWithContent";
import { ServicePublic as ApiServicePublic } from "../types/api_client/servicePublic";
import { internalError, notFoundError, ServiceError } from "../types/error";
import {
  toAppMessageWithContent,
  toAppMessageWithoutContent
} from "../types/message";
import { toAppService } from "../types/service";
import { User } from "../types/user";
import { log } from "../utils/logger";
import SimpleHttpOperationResponse from "../utils/simpleResponse";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

const messageErrorOnUnknownResponse = "Unknown response.";
const messageErrorOnApiError = "Api error.";
const logErrorOnApiError = "Api error: %s";
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
  ): Promise<Either<ServiceError, Messages>> {
    const response = await this.apiClient
      .getClient(user.fiscal_code)
      .getMessagesByUserWithHttpOperationResponse();

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      const errorOrProblemJson = ProblemJson.decode(
        simpleResponse.parsedBody()
      );
      if (isLeft(errorOrProblemJson)) {
        log.error(
          "Unknown response from getMessagesByUser API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        return left(internalError(messageErrorOnUnknownResponse));
      }

      if (simpleResponse.isNotFound()) {
        return left(notFoundError(messageNotFound));
      } else {
        log.error(logErrorOnApiError, simpleResponse.parsedBody());
        return left(internalError(messageErrorOnApiError));
      }
    }

    const errorOrApiMessages = GetMessagesByUserOKResponse.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrApiMessages)) {
      log.error(
        "Unknown response from getMessagesByUser API: %s",
        ReadableReporter.report(errorOrApiMessages)
      );
      return left(internalError(messageErrorOnUnknownResponse));
    }

    const apiMessages = errorOrApiMessages.value;

    const appMessages = apiMessages.items.map(toAppMessageWithoutContent);
    return right({
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
  ): Promise<Either<ServiceError, MessageWithContent>> {
    const response = await this.apiClient
      .getClient(user.fiscal_code)
      .getMessageWithHttpOperationResponse(messageId);

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      const errorOrProblemJson = ProblemJson.decode(
        simpleResponse.parsedBody()
      );
      if (isLeft(errorOrProblemJson)) {
        log.error(
          "Unknown response from getMessage API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        return left(internalError(messageErrorOnUnknownResponse));
      }

      if (simpleResponse.isNotFound()) {
        return left(notFoundError(messageNotFound));
      } else {
        log.error(logErrorOnApiError, simpleResponse.parsedBody());
        return left(internalError(messageErrorOnApiError));
      }
    }

    const errorOrApiMessage = MessageResponseWithContent.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrApiMessage)) {
      log.error(
        "Unknown response from getMessage API: %s",
        ReadableReporter.report(errorOrApiMessage)
      );
      return left(internalError(messageErrorOnUnknownResponse));
    }

    const apiMessage = errorOrApiMessage.value;
    return right(toAppMessageWithContent(apiMessage));
  }

  /**
   * Retrieve all the information about the service that has sent a message.
   */
  public async getService(
    user: User,
    serviceId: string
  ): Promise<Either<ServiceError, ProxyServicePublic>> {
    const response = await this.apiClient
      .getClient(user.fiscal_code)
      .getServiceWithHttpOperationResponse(serviceId);

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      const errorOrProblemJson = ProblemJson.decode(
        simpleResponse.parsedBody()
      );
      if (isLeft(errorOrProblemJson)) {
        log.error(
          "Unknown response from getService API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        return left(internalError(messageErrorOnUnknownResponse));
      }

      if (simpleResponse.isNotFound()) {
        return left(notFoundError(messageNotFound));
      } else {
        log.error(logErrorOnApiError, simpleResponse.parsedBody());
        return left(internalError(messageErrorOnApiError));
      }
    }

    const errorOrApiService = ApiServicePublic.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrApiService)) {
      log.error(
        "Unknown response from getService API: %s",
        ReadableReporter.report(errorOrApiService)
      );
      return left(internalError(messageErrorOnUnknownResponse));
    }

    const apiService = errorOrApiService.value;
    return right(toAppService(apiService));
  }

  public async getServicesByRecipient(
    user: User
  ): Promise<Either<ServiceError, ServiceList>> {
    const response = await this.apiClient
      .getClient(user.fiscal_code)
      .getServicesByRecipientWithHttpOperationResponse(user.fiscal_code);

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      const errorOrProblemJson = ProblemJson.decode(
        simpleResponse.parsedBody()
      );
      if (isLeft(errorOrProblemJson)) {
        log.error(
          "Unknown response from getServicesByRecipient API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        return left(internalError(messageErrorOnUnknownResponse));
      }

      log.error(logErrorOnApiError, simpleResponse.parsedBody());
      return left(internalError(messageErrorOnApiError));
    }

    const errorOrServices = GetServicesByRecipientOKResponse.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrServices)) {
      log.error(
        "Unknown response from getServicesByRecipient API: %s",
        ReadableReporter.report(errorOrServices)
      );
      return left(internalError(messageErrorOnUnknownResponse));
    }

    const apiServices = errorOrServices.value;

    return right({
      items: apiServices.items,
      next: apiServices.next,
      page_size: apiServices.pageSize
    });
  }

  public async getVisibleServices(
    user: User
  ): Promise<Either<ServiceError, ServiceList>> {
    const response = await this.apiClient
      .getClient(user.fiscal_code)
      .getVisibleServicesWithHttpOperationResponse();

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      const errorOrProblemJson = ProblemJson.decode(
        simpleResponse.parsedBody()
      );
      if (isLeft(errorOrProblemJson)) {
        log.error(
          "Unknown response from getVisibleServices API: %s",
          ReadableReporter.report(errorOrProblemJson)
        );
        return left(internalError(messageErrorOnUnknownResponse));
      }

      log.error(logErrorOnApiError, simpleResponse.parsedBody());
      return left(internalError(messageErrorOnApiError));
    }

    const errorOrServices = GetVisibleServicesOKResponse.decode(
      simpleResponse.parsedBody()
    );
    if (isLeft(errorOrServices)) {
      log.error(
        "Unknown response from getVisibleServices API: %s",
        ReadableReporter.report(errorOrServices)
      );
      return left(internalError(messageErrorOnUnknownResponse));
    }

    const apiServices = errorOrServices.value;

    return right({
      items: apiServices.items,
      next: apiServices.next,
      page_size: apiServices.pageSize
    });
  }
}
