import { ResponseErrorInternal } from "@pagopa/ts-commons/lib/responses";
import { NextFunction, Request, Response } from "express";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { LollipopApiClient } from "../../clients/lollipop";
import { ISessionStorage } from "../../services/ISessionStorage";
import { withLollipopHeadersFromRequest } from "../../types/lollipop";
import {
  withOptionalUserFromRequest,
  withUserFromRequest,
} from "../../types/user";
import { log } from "../logger";
import {
  extractLollipopLocalsFromLollipopHeaders,
  extractLollipopLocalsFromLollipopHeadersLegacy,
} from "../lollipop";

/**
 * @deprecated
 */
export const expressLollipopMiddlewareLegacy: (
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage,
) => (req: Request, res: Response, next: NextFunction) => Promise<void> =
  (lollipopClient, sessionStorage) => (req, res, next) =>
    pipe(
      TE.tryCatch(
        () =>
          withUserFromRequest(req, async (user) =>
            withLollipopHeadersFromRequest(req, async (lollipopHeaders) =>
              pipe(
                extractLollipopLocalsFromLollipopHeadersLegacy(
                  lollipopClient,
                  sessionStorage,
                  user.fiscal_code,
                  lollipopHeaders,
                ),
                TE.map((lollipopLocals) => {
                  res.locals = { ...res.locals, ...lollipopLocals };
                }),
                TE.toUnion,
              )(),
            ),
          ),
        (err) => {
          log.error(
            "lollipopMiddleware|error executing the middleware [%s]",
            E.toError(err).message,
          );
          return ResponseErrorInternal("Error executing middleware");
        },
      ),
      TE.chain((maybeErrorResponse) =>
        maybeErrorResponse === undefined
          ? TE.of(void 0)
          : TE.left(maybeErrorResponse),
      ),
      TE.mapLeft((response) => response.apply(res)),
      TE.map(() => next()),
      TE.toUnion,
    )();

export const expressLollipopMiddleware: (
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage,
) => (req: Request, res: Response, next: NextFunction) => Promise<void> =
  (lollipopClient, sessionStorage) => (req, res, next) =>
    pipe(
      TE.tryCatch(
        () =>
          withOptionalUserFromRequest(req, async (user) =>
            withLollipopHeadersFromRequest(req, async (lollipopHeaders) =>
              pipe(
                extractLollipopLocalsFromLollipopHeaders(
                  lollipopClient,
                  sessionStorage,
                  lollipopHeaders,
                  O.toUndefined(user)?.fiscal_code,
                ),
                TE.map((lollipopLocals) => {
                  res.locals = { ...res.locals, ...lollipopLocals };
                }),
                TE.toUnion,
              )(),
            ),
          ),
        (err) => {
          log.error(
            "lollipopMiddleware|error executing the middleware [%s]",
            E.toError(err).message,
          );
          return ResponseErrorInternal("Error executing middleware");
        },
      ),
      TE.chain((maybeErrorResponse) =>
        maybeErrorResponse === undefined
          ? TE.of(void 0)
          : TE.left(maybeErrorResponse),
      ),
      TE.mapLeft((response) => response.apply(res)),
      TE.map(() => next()),
      TE.toUnion,
    )();
