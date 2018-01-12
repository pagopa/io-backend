// @flow

"use strict";

import type { APIError } from "../types/error";
import {
  GetMessagesByUserOKResponse,
  MessageResponse,
  ProblemJson
} from "../api/models";
import type { ApiClientFactoryInterface } from "../services/apiClientFactoryInterface";
import { toAppMessage } from "../types/message";
import type { User } from "../types/user";
import { extractUserFromRequest } from "../types/user";

/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */
export default class MessagesController {
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
            function(apiMessages: GetMessagesByUserOKResponse | ProblemJson) {
              // TODO: find a better way to identify the type of the response.
              if (apiMessages.hasOwnProperty("status")) {
                res.status(apiMessages.status).json({
                  message: apiMessages.detail
                });
                return;
              }

              const appMessages = apiMessages.items.map(toAppMessage);

              res.json({ items: appMessages, pageSize: apiMessages.pageSize });
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
            function(apiMessage: MessageResponse | ProblemJson) {
              // TODO: find a better way to identify the type of the response.
              if (apiMessage.hasOwnProperty("status")) {
                res.status(apiMessage.status).json({
                  message: apiMessage.detail
                });
                return;
              }

              const appMessage = toAppMessage(apiMessage);

              res.json(appMessage);
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
