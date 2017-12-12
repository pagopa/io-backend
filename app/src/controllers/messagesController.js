// @flow

"use strict";

/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import type { User } from "../types/user";
import type { APIError } from "../types/error";
import { GetMessagesByUserOKResponse, MessageResponse } from "../api/models";
import type { ApiClientFactoryInterface } from "../services/apiClientFactoryInterface";
import { toAppMessage } from "../types/message";

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
    const reqWithUser = ((req: Object): { user: User });

    this.apiClient
      .getClient(reqWithUser.user.fiscal_code)
      .getMessagesByUser()
      .then(
        function(apiMessages: GetMessagesByUserOKResponse) {
          const appMessages = apiMessages.items.map(apiMessage => {
            return toAppMessage(apiMessage);
          });

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
}
