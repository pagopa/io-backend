import * as express from "express";
import {
  IResponse,
  ResponseErrorInternal
} from "italia-ts-commons/lib/responses";

/**
 * Convenience method that transforms a function (handler),
 * which takes an express.Request as input and returns an IResponse,
 * into an express controller.
 */
export function toExpressHandler<T, P>(
  handler: (req: express.Request) => Promise<IResponse<T>>,
  object?: P
): (req: express.Request, res: express.Response) => void {
  return (req, res) =>
    handler
      .call(object, req)
      .catch(ResponseErrorInternal)
      .then(response => {
        // tslint:disable-next-line:no-object-mutation
        res.locals.detail = response.detail;
        response.apply(res);
      });
}
