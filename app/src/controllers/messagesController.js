// @flow

"use strict";

import type { APIError } from "../types/error";
import { GetMessagesByUserOKResponse, MessageResponse } from "../api/models";
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
            function(apiMessages: GetMessagesByUserOKResponse) {
              const appMessages = apiMessages.items.map(toAppMessage);

              res.json({ items: appMessages, pageSize: apiMessages.pageSize });
            },
            function(err: APIError) {
              if (err.statusCode === 404) {
                res.status(404).json({ message: err.message });
                return;
              }

              res.status(500).json({
                message: "There was an error in retrieving the messages."
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
      () => {
        res.status(500).json({
          message:
            "There was an error extracting the user profile from the request."
        });
      },
      (user: User) => {
        this.apiClient
          .getClient(user.fiscal_code)
          .getMessage(req.params.id)
          .then(
            function(apiMessage: MessageResponse) {
              const appMessage = toAppMessage(apiMessage);

              res.json(appMessage);
            },
            function(err: APIError) {
              if (err.statusCode === 404) {
                res.status(404).json({ message: err.message });
                return;
              }

              res.status(500).json({
                message: "There was an error in retrieving the message."
              });
            }
          );
      }
    );
  }
}
