/**
 *
 */

import * as express from "express";
import { IApiClientFactoryInterface } from "../services/iApiClientFactory";
import {
  validateProblemJson,
  validateResponse
} from "../types/api";
import { CreatedMessageWithContent } from "../types/api/CreatedMessageWithContent";
import { CreatedMessageWithoutContent } from "../types/api/CreatedMessageWithoutContent";
import { APIError } from "../types/error";
import {
  createdMessageToAppMessage,
  messageResponseToAppMessage
} from "../types/message";
import { extractUserFromRequest, User } from "../types/user";
import ControllerBase from "./ControllerBase";

/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */
export default class MessagesController extends ControllerBase {

  constructor(apiClient: IApiClientFactoryInterface) {
    super(apiClient);
  }

  /**
   * Returns the messages for the user identified by the provided fiscal
   * code.
   *
   * @param req
   * @param res
   */
  public getUserMessages(req: express.Request, res: express.Response):void {
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
                CreatedMessageWithContent
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
            (err:APIError) => {
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
  public getUserMessage(req: express.Request, res: express.Response):void {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      (error: string) => {
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
              validateResponse(maybeApiMessage, CreatedMessageWithoutContent).fold(
                // Look if object is a ProblemJson.
                () => validateProblemJson(maybeApiMessage, res),
                // All correct, return the response to the client.
                apiMessage => {
                  res.json(messageResponseToAppMessage(apiMessage));
                }
              );
            },
            (err:APIError) => {
              res.status(err.statusCode).json({
                message: err.message
              });
            }
          );
      }
    );
  }
}
