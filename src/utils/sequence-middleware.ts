import * as express from "express";

import { ExpressMiddleware } from "./express";

/**
 * Utility that composes two Express middlewares in sequence.
 *
 * Executes `middleware1` first and, only if it completes without error,
 * executes `middleware2`. If `middleware1` calls its callback with an error,
 * the error is forwarded to `next` following Express error-handling conventions.
 *
 * @param middleware1 First middleware
 * @param middleware2 Second middleware
 * @returns Express middleware that runs the chain in order.
 */
export const sequenceMiddleware =
  (middleware1: ExpressMiddleware, middleware2: ExpressMiddleware) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    middleware1(req, res, (err) => {
      // (https://expressjs.com/en/guide/error-handling.html)
      if (err) return next(err);
      middleware2(req, res, next);
    });
  };
