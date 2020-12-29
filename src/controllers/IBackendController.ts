import { Express } from "express";
import { ParamsDictionary, RequestHandler } from "express-serve-static-core";

/*
 * Standard interface for Controllers
 */
export interface IBackendController {
  /**
   * Method used for setting up routing for Controller
   * @param app The Express app
   * @param basePath The base path of the api. NOTE: Do not include trailing slash
   * @param handlers A list of middlewares to be called before the Controller's functions
   */
  readonly setupRouting: <ResBody = unknown, ReqBody = unknown>(
    app: Express,
    basePath: string,
    ...handlers: ReadonlyArray<
      RequestHandler<ParamsDictionary, ResBody, ReqBody>
    >
  ) => void;
}
