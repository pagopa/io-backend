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
import {
  GetMessagesByUserOKResponseModel,
  MessageResponseModel,
  ProblemJsonModel
} from "../types/api";
import * as t from "io-ts/lib/index";

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
            (maybeApiMessages: GetMessagesByUserOKResponse | ProblemJson) => {
              // Look if the response is a GetMessagesByUserOKResponse.
              t
                .validate(maybeApiMessages, GetMessagesByUserOKResponseModel)
                .fold(
                  () => {
                    // Look if the response is a ProblemJson.
                    t.validate(maybeApiMessages, ProblemJsonModel).fold(
                      () => {
                        res.status(500).json({
                          // If we reach this something very bad as happened.
                          message: "Unhandled error."
                        });
                      },
                      error => {
                        res.status(error.status).json({
                          // Forward the error received from the API.
                          message: error.detail
                        });
                      }
                    );
                  },
                  apiMessages => {
                    // All correct, return the response to the client.
                    const appMessages = apiMessages.items.map(toAppMessage);
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
            (maybeApiMessage: MessageResponse | ProblemJson) => {
              // Look if the response is a GetProfileOKResponse.
              t.validate(maybeApiMessage, MessageResponseModel).fold(
                () => {
                  // Look if the response is a ProblemJson.
                  t.validate(maybeApiMessage, ProblemJsonModel).fold(
                    () => {
                      res.status(500).json({
                        // If we reach this something very bad as happened.
                        message: "Unhandled error."
                      });
                    },
                    error => {
                      res.status(error.status).json({
                        // Forward the error received from the API.
                        message: error.detail
                      });
                    }
                  );
                },
                apiMessage => {
                  // All correct, return the response to the client.
                  res.json(toAppMessage(apiMessage));
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
