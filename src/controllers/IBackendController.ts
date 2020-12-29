import { Express } from "express";
import { ParamsDictionary, RequestHandler } from "express-serve-static-core";

/*
 * Standard interface for Backend controllers
 */
export interface IBackendController {
  /**
   * Method used for seting up routing for Controller
   */

  // tslint:disable-next-line: no-any
  readonly setupRouting: <ResBody = any, ReqBody = any>(
    app: Express,
    basePath: string,
    ...handlers: ReadonlyArray<
      RequestHandler<ParamsDictionary, ResBody, ReqBody>
    >
  ) => void;
}
