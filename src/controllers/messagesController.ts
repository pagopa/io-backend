/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */

import * as express from "express";

import MessagesService from "../services/messagesService";
import { withUserFromRequest } from "../types/user";

export default class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Returns the messages for the user identified by the provided fiscal code.
   */
  public readonly getMessagesByUser = async (req: express.Request) =>
    withUserFromRequest(req, this.messagesService.getMessagesByUser);

  /**
   * Returns the message identified by the message id.
   */
  public readonly getMessage = async (req: express.Request) =>
    withUserFromRequest(req, user =>
      this.messagesService.getMessage(user, req.params.id)
    );
}
