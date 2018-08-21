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
import { CreatedMessageWithContent } from "../types/api/CreatedMessageWithContent";
import { Messages } from "../types/api/Messages";
import { ProblemJson } from "../types/api/ProblemJson";
import { ServiceList } from "../types/api/ServiceList";
import { ServicePublic as ProxyServicePublic } from "../types/api/ServicePublic";
import { ServicePublic as ApiServicePublic } from "../types/api_client/servicePublic";
import { internalError, notFoundError, ServiceError } from "../types/error";
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
    try {
      const client = this.apiClient.getClient();

      const res = await client.getMessages({
        fiscalCode: user.fiscal_code
      });

      // If the response is undefined (can't be decoded) or the status is not 200 dispatch a failure action.
      if (!res || res.status !== 200) {
        return left(internalError(messageErrorOnUnknownResponse));
      } else {
        return right(res.value);
      }
    } catch (e) {
      return left(internalError(messageErrorOnUnknownResponse));
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

      // If the response is undefined (can't be decoded) or the status is not 200 dispatch a failure action.
      if (!res || res.status !== 200) {
        return left(internalError(messageErrorOnUnknownResponse));
      } else {
        return right(res.value);
      }
    } catch (e) {
      return left(internalError(messageErrorOnUnknownResponse));
    }
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

    const errorOrServices = ServiceList.decode(simpleResponse.parsedBody());
    if (isLeft(errorOrServices)) {
      log.error(
        "Unknown response from getServicesByRecipient API: %s",
        ReadableReporter.report(errorOrServices)
      );
      return left(internalError(messageErrorOnUnknownResponse));
    }

    const apiServices = errorOrServices.value;

    const appServices = apiServices.items;
    return right({
      items: appServices,
      page_size: apiServices.page_size
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

    const errorOrServices = ServiceList.decode(simpleResponse.parsedBody());
    if (isLeft(errorOrServices)) {
      log.error(
        "Unknown response from getVisibleServices API: %s",
        ReadableReporter.report(errorOrServices)
      );
      return left(internalError(messageErrorOnUnknownResponse));
    }

    const apiServices = errorOrServices.value;
    return right(apiServices);
  }
}
