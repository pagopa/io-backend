import { ResponseErrorInternal } from "@pagopa/ts-commons/lib/responses";
import { NextFunction, Request, Response } from "express";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { LollipopApiClient } from "../../clients/lollipop";
import { ISessionStorage } from "../../services/ISessionStorage";
import { withLollipopHeadersFromRequest } from "../../types/lollipop";
import { withUserFromRequest } from "../../types/user";
import { log } from "../logger";
import {
  extractLollipopLocalsFromLollipopHeaders,
  extractLollipopLocalsFromLollipopHeadersLegacy
} from "../lollipop";

/**
 * @deprecated
 */
export const expressLollipopMiddlewareLegacy: (
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage
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
                  lollipopHeaders
                ),
                TE.map((lollipopLocals) => {
                  res.locals = { ...res.locals, ...lollipopLocals };
                }),
                TE.toUnion
              )()
            )
          ),
        (err) => {
          log.error(
            "lollipopMiddleware|error executing the middleware [%s]",
            E.toError(err).message
          );
          return ResponseErrorInternal("Error executing middleware");
        }
      ),
      TE.chain((maybeErrorResponse) =>
        maybeErrorResponse === undefined
          ? TE.of(void 0)
          : TE.left(maybeErrorResponse)
      ),
      TE.mapLeft((response) => response.apply(res)),
      TE.map(() => next()),
      TE.toUnion
    )();

/**
 * ⚠️ This middleware should only be used once the `FF_IO_X_USER_TOKEN` feature flag is set to `ALL`.
 *
 * Retrieves Lollipop LC parameters if the user has a valid Lollipop session, and integrate into res.locals values
 */
export const expressLollipopMiddleware: (
  lollipopClient: ReturnType<typeof LollipopApiClient>
) => (req: Request, res: Response, next: NextFunction) => Promise<void> =
  (lollipopClient) => (req, res, next) =>
    pipe(
      TE.tryCatch(
        () =>
          withUserFromRequest(req, async (user) =>
            withLollipopHeadersFromRequest(req, async (lollipopHeaders) =>
              pipe(
                extractLollipopLocalsFromLollipopHeaders(
                  lollipopClient,
                  lollipopHeaders,
                  user
                ),
                TE.map((lollipopLocals) => {
                  res.locals = { ...res.locals, ...lollipopLocals };
                }),
                TE.toUnion
              )()
            )
          ),
        (err) => {
          log.error(
            "lollipopMiddleware|error executing the middleware [%s]",
            E.toError(err).message
          );
          return ResponseErrorInternal("Error executing middleware");
        }
      ),
      TE.chain((maybeErrorResponse) =>
        maybeErrorResponse === undefined
          ? TE.of(void 0)
          : TE.left(maybeErrorResponse)
      ),
      TE.mapLeft((response) => response.apply(res)),
      TE.map(() => next()),
      TE.toUnion
    )();
