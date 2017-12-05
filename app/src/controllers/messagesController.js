// @flow

"use strict";

import type { User } from "../types/user";
import type { ApiClientInterface } from "../services/apiClientInterface";
import type { APIError } from "../types/error";
import { GetMessagesByUserOKResponse, MessageResponse } from "../api/models";

/**
 *
 */
export default class MessagesController {
  apiClient: ApiClientInterface;

  /**
   * Class constructor.
   *
   * @param apiClient
   */
  constructor(apiClient: ApiClientInterface) {
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
    const reqWithUser = ((req: Object): { user: User });

    this.apiClient
      .getClient(reqWithUser.user.fiscal_code)
      .getMessagesByUser()
      .then(
        function(messages: GetMessagesByUserOKResponse) {
          res.json(messages);
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

  /**
   * Returns the message identified by the message id.
   *
   * @param req
   * @param res
   */
  getUserMessage(req: express$Request, res: express$Response) {
    const reqWithUser = ((req: Object): { user: User });

    this.apiClient
      .getClient(reqWithUser.user.fiscal_code)
      .getMessage(req.params.id)
      .then(
        function(messages: MessageResponse) {
          res.json(messages);
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
}
