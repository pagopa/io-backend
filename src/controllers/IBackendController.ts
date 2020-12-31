import { Express } from "express";
import { ParamsDictionary, RequestHandler } from "express-serve-static-core";

/*
 * Standard interface for Controllers
 */
export interface IBackendController {
  /**
   * Method used for setting up routing for Controller
   * @param app The Express app
   * @param handlers A list of middlewares to be called before the Controller's functions
   * @returns The router with paths for Controller
   */
  readonly setupRouting: <ResBody = unknown, ReqBody = unknown>(
    app: Express,
    ...handlers: ReadonlyArray<
      RequestHandler<ParamsDictionary, ResBody, ReqBody>
    >
  ) => void;
}
