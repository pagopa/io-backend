/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import MessagesService from "../services/messagesService";
import { extractUserFromRequest } from "../types/user";

export default class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Returns the messages for the user identified by the provided fiscal
   * code.
   */
  public getMessagesByUser(req: express.Request, res: express.Response): void {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      res.status(500).json({
        message: error.message
      });
      return;
    }

    const user = errorOrUser.value;
    this.messagesService
      .getMessagesByUser(user)
      .then(data => {
        res.json(data);
      })
      .catch(err =>
        res.status(500).json({
          message: err.message
        })
      );
  }

  /**
   * Returns the message identified by the message id.
   */
  public getMessage(req: express.Request, res: express.Response): void {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      res.status(500).json({
        message: error.message
      });
      return;
    }

    // TODO: validate req.params.id
    const user = errorOrUser.value;
    this.messagesService
      .getMessage(user, req.params.id)
      .then(data => {
        res.json(data);
      })
      .catch(err =>
        res.status(500).json({
          message: err.message
        })
      );
  }
}
