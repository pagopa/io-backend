/**
 * This controller handles webhook requests from the API backend.
 */

import * as express from "express";
import { Either, right } from "fp-ts/lib/Either";
import { IResponse } from "../app";

export default class NotificationController {
  public async notify(
    _: express.Request
  ): Promise<Either<Error, IResponse<string>>> {
    return right({
      body: "ok",
      status: 200
    });
  }
}
