// @flow

"use strict";

import type { APIError } from "../types/error";
import {
  createdMessageToAppMessage,
  messageResponseToAppMessage
} from "../types/message";
import type { User } from "../types/user";
import { extractUserFromRequest } from "../types/user";
import {
  GetMessagesByUserOKResponseModel,
  MessageResponseModel,
  validateProblemJson,
  validateResponse
} from "../types/api";
import ControllerBase from "./ControllerBase";
import type { ApiClientFactoryInterface } from "../services/apiClientFactoryInterface";

/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */
export default class MessagesController extends ControllerBase {
  /**
   * Class constructor.
   *
   * @param apiClient
   */
  constructor(apiClient: ApiClientFactoryInterface) {
    super(apiClient);
  }

  /**
   * Returns the messages for the user identified by the provided fiscal
   * code.
   *
   * @param req
   * @param res
   */
  getUserMessages(req: express$Request, res: express$Response) {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      () => {
        res.status(500).json({
          message:
            "There was an error extracting the user profile from the request."
        });
      },
      (user: User) => {
        this.apiClient
          .getClient(user.fiscal_code)
          .getMessagesByUser()
          .then(
            maybeApiMessages => {
              // Look if the response is a GetMessagesByUserOKResponse.
              validateResponse(
                maybeApiMessages,
                GetMessagesByUserOKResponseModel
              ).fold(
                // Look if object is a ProblemJson.
                () => validateProblemJson(maybeApiMessages, res),
                // All correct, return the response to the client.
                apiMessages => {
                  const appMessages = apiMessages.items.map(
                    createdMessageToAppMessage
                  );
                  res.json({
                    items: appMessages,
                    pageSize: apiMessages.pageSize
                  });
                }
              );
            },
            function(err: APIError) {
              res.status(err.statusCode).json({
                message: err.message
              });
            }
          );
      }
    );
  }

  /**
   * Returns the message identified by the message id.
   *
   * @param req
   * @param res
   */
  getUserMessage(req: express$Request, res: express$Response) {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      (error: String) => {
        res.status(500).json({
          message: error
        });
      },
      (user: User) => {
        this.apiClient
          .getClient(user.fiscal_code)
          .getMessage(req.params.id)
          .then(
            maybeApiMessage => {
              // Look if the response is a GetProfileOKResponse.
              validateResponse(maybeApiMessage, MessageResponseModel).fold(
                // Look if object is a ProblemJson.
                () => validateProblemJson(maybeApiMessage, res),
                // All correct, return the response to the client.
                apiMessage => {
                  res.json(messageResponseToAppMessage(apiMessage));
                }
              );
            },
            function(err: APIError) {
              res.status(err.statusCode).json({
                message: err.message
              });
            }
          );
      }
    );
  }
}
