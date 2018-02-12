// @flow

"use strict";

import {
  GetMessagesByUserOKResponseModel,
  MessageResponseModel,
  ServicePublicModel,
  validateProblemJson,
  validateResponse
} from "../types/api";
import {
  createdMessageToAppMessage,
  messageResponseToAppMessage
} from "../types/message";
import type { ApiClientFactoryInterface } from "./apiClientFactoryInterface";
import type { MessageServiceInterface } from "./messageServiceInterface";
import type { APIError } from "../types/error";
import { ServicePublicToAppService } from "../types/service";

/**
 * This service calls the API messages endpoint and adapt the response to the
 * needs of the app.
 */
export default class MessageService implements MessageServiceInterface {
  apiClient: ApiClientFactoryInterface;

  /**
   * Class constructor.
   *
   * @param apiClient
   */
  constructor(apiClient: ApiClientFactoryInterface) {
    this.apiClient = apiClient;
  }

  /**
   * {@inheritDoc}
   */
  getMessagesByUser(fiscalCode: string, res: express$Response) {
    this.apiClient
      .getClient(fiscalCode)
      .getMessagesByUser()
      .then(
        maybeApiMessages =>
          this.manageUserMessagesResponse(maybeApiMessages, res),
        err => {
          res.status(err.statusCode).json({
            message: err.message
          });
        }
      );
  }

  /**
   * {@inheritDoc}
   */
  getMessage(fiscalCode: string, messageId: string, res: express$Response) {
    this.apiClient
      .getClient(fiscalCode)
      .getMessage(messageId)
      .then(
        maybeApiMessage => this.manageMessageResponse(maybeApiMessage, res),
        err => {
          res.status(err.statusCode).json({
            message: err.message
          });
        }
      );
  }

  /**
   * {@inheritDoc}
   */
  getService(fiscalCode: string, serviceId: string, res: express$Response) {
    this.apiClient
      .getClient(fiscalCode)
      .getService(serviceId)
      .then(
        maybeService => this.manageServiceResponse(maybeService, res),
        function(err: APIError) {
          res.status(err.statusCode).json({
            message: err.message
          });
        }
      );
  }

  /**
   * Analyses the API response and return the correct information to the app.
   *
   * @param maybeApiMessages
   * @param res
   */
  manageUserMessagesResponse(maybeApiMessages: any, res: express$Response) {
    // Look if the response is a GetMessagesByUserOKResponse.
    validateResponse(maybeApiMessages, GetMessagesByUserOKResponseModel).fold(
      // Look if object is a ProblemJson.
      () => validateProblemJson(maybeApiMessages, res),
      // All correct, return the response to the client.
      apiMessages => {
        const appMessages = apiMessages.items.map(createdMessageToAppMessage);
        res.json({
          items: appMessages,
          pageSize: apiMessages.pageSize
        });
      }
    );
  }

  /**
   * Analyses the API response and return the correct information to the app.
   *
   * @param maybeApiMessage
   * @param res
   */
  manageMessageResponse(maybeApiMessage: any, res: express$Response) {
    // Look if the response is a GetProfileOKResponse.
    validateResponse(maybeApiMessage, MessageResponseModel).fold(
      // Look if object is a ProblemJson.
      () => validateProblemJson(maybeApiMessage, res),
      // All correct, return the response to the client.
      apiMessage => {
        res.json(messageResponseToAppMessage(apiMessage));
      }
    );
  }

  /**
   * Analyses the API response and return the correct information to the app.
   *
   * @param maybeService
   * @param res
   */
  manageServiceResponse(maybeService: any, res: express$Response) {
    // Look if the response is a GetMessagesByUserOKResponse.
    validateResponse(maybeService, ServicePublicModel).fold(
      // Look if object is a ProblemJson.
      () => validateProblemJson(maybeService, res),
      // All correct, return the response to the client.
      service => {
        res.json(ServicePublicToAppService(service));
      }
    );
  }
}
