import * as express from "express";
import {
  IResponse,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import { flow, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";

export type ExpressMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void;

export type ResLocals = Record<string, unknown> & {
  detail?: string;
  body?: Buffer;
};
/**
 * Convenience method that transforms a function (handler),
 * which takes an express.Request as input and returns an IResponse,
 * into an express controller.
 */
export function toExpressHandler<T, P, L extends ResLocals>(
  handler: (req: express.Request, locals?: L) => Promise<IResponse<T>>,
  object?: P
): (req: express.Request, res: express.Response<T, L>) => void {
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  return (req, res): Promise<void | undefined> =>
    handler
      .call(object, req, res.locals)
      .catch(ResponseErrorInternal)
      .then((response) => {
        res.locals.detail = response.detail;
        response.apply(res);
      });
}

/**
 * Convenience method that transforms a function (handler),
 * which takes an express.Request as input and returns an IResponse,
 * into an express middleware. If handler returns undefined
 * the next middleware is called
 */
export function toExpressMiddleware<T, P>(
  handler: (req: express.Request) => Promise<IResponse<T> | undefined>,
  object?: P
): ExpressMiddleware {
  return (req, res, next): Promise<void> =>
    pipe(
      TE.tryCatch(
        () => handler.call(object, req),
        flow(E.toError, (e) => ResponseErrorInternal(e.message))
      ),
      TE.chainW(
        flow(
          O.fromNullable,
          O.map(TE.left),
          O.getOrElseW(() => TE.right(next()))
        )
      ),
      TE.mapLeft((response) => {
        res.locals.detail = response.detail;
        response.apply(res);
      }),
      TE.toUnion
    )();
}

/**
 * An Express handler that always respond with the same response object
 */
export function constantExpressHandler<T>(
  response: IResponse<T>
): (req: express.Request, res: express.Response) => void {
  return (_, res) => {
    res.locals.detail = response.detail;
    response.apply(res);
  };
}
