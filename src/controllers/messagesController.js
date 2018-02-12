// @flow

"use strict";

import type { User } from "../types/user";
import { extractUserFromRequest } from "../types/user";
import MessageService from "../services/messageService";

/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */
export default class MessagesController {
  messageService: MessageService;

  /**
   * Class constructor.
   *
   * @param messageService
   */
  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  /**
   * Returns the messages for the user identified by the provided fiscal
   * code.
   *
   * @param req
   * @param res
   */
  getMessagesByUser(req: express$Request, res: express$Response) {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      () => {
        res.status(500).json({
          message:
            "There was an error extracting the user profile from the request."
        });
      },
      (user: User) => {
        this.messageService.getMessagesByUser(user.fiscal_code, res);
      }
    );
  }

  /**
   * Returns the message identified by the message id.
   *
   * @param req
   * @param res
   */
  getMessage(req: express$Request, res: express$Response) {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      () => {
        res.status(500).json({
          message:
            "There was an error extracting the user profile from the request."
        });
      },
      (user: User) => {
        this.messageService.getMessage(user.fiscal_code, req.params.id, res);
      }
    );
  }
}
