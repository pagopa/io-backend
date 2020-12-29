import { Express } from "express";
import { ParamsDictionary, RequestHandler } from "express-serve-static-core";

/*
 * Standard interface for Controllers
 */
export interface IBackendController {
  /**
   * Method used for setting up routing for Controller
   */

  readonly setupRouting: <ResBody = unknown, ReqBody = unknown>(
    app: Express,
    basePath: string,
    ...handlers: ReadonlyArray<
      RequestHandler<ParamsDictionary, ResBody, ReqBody>
    >
  ) => void;
}
