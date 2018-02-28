/**
 *
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import MessagesService from "../services/MessagesService";
import { extractUserFromRequest } from "../types/user";

/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */
export default class ServicesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Returns the service identified by the provided id
   * code.
   *
   * @param req
   * @param res
   */
  public getService(req: express.Request, res: express.Response): void {
    const maybeUser = extractUserFromRequest(req);

    if (isLeft(maybeUser)) {
      // Unable to extract the user from the request.
      const error = maybeUser.value;
      res.status(500).json({
        message: error
      });
      return;
    }

    // TODO: validate req.params.id
    const user = maybeUser.value;
    this.messagesService
      .getService(user, req.params.id)
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
