import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

import { sequenceMiddleware } from "../sequence-middleware";
import { getByXUserToken } from "../x-user-token";

/**
 * Middleware that decodes an user based on the `x-user` header.
 *
 * if valid, it assigns the user object to `req.user`. If the token is missing
 * or invalid, responds with `401 Unauthorized` and does not call `next()`.
 *
 * @param req Express request object, used to read the `x-user` header and set `req.user`.
 * @param res Express response object, used to send `401` on authentication failure.
 * @param next Callback to pass control to the next middleware when authentication succeeds.
 */
export const xUserMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const xUser = req.header("x-user");
  if (xUser === undefined) {
    res.status(401).send();
    return;
  }

  const userFromToken = getByXUserToken(xUser);

  if (E.isLeft(userFromToken) || O.isNone(userFromToken.right)) {
    res.status(401).send();
    return;
  }
  req.user = userFromToken.right.value;

  next();
};

/**
 * Middleware for API key authentication.
 *
 * Returns an Express middleware that reads an API key from the specified header
 * and compares it against a primary key and, optionally, a secondary key.
 * If the key is missing or does not match any valid key, it responds with
 * `401 Unauthorized`; otherwise it calls `next()`.
 *
 * @param apiKeyHeaderName Name of the header from which to read the API key (e.g. `"x-api-key"`).
 * @param primaryKey Primary API key considered valid.
 * @param secondaryKey Optional secondary API key also considered valid.
 * @returns An Express middleware function that validates the API key.
 */
export const getApiKeyAuthMiddleware =
  (
    apiKeyHeaderName: NonEmptyString,
    primaryKey: NonEmptyString,
    secondaryKey?: NonEmptyString
  ) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = req.header(apiKeyHeaderName);

    if (
      apiKey === undefined ||
      (apiKey !== primaryKey &&
        (secondaryKey === undefined || apiKey !== secondaryKey))
    ) {
      res.status(401).send();
      return;
    }
    next();
  };

export const getAuthenticatedXUserMiddleware = (
  apiKeyHeaderName: NonEmptyString,
  primaryKey: NonEmptyString,
  secondaryKey?: NonEmptyString
) =>
  sequenceMiddleware(
    getApiKeyAuthMiddleware(apiKeyHeaderName, primaryKey, secondaryKey),
    xUserMiddleware
  );
