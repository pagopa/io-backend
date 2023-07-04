import { Request, Response, NextFunction } from "express";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { ResponseErrorInternal } from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { withOptionalUserFromRequest } from "../../types/user";
import { LollipopApiClient } from "../../clients/lollipop";
import { withLollipopHeadersFromRequest } from "../../types/lollipop";
import { log } from "../logger";
import { extractLollipopLocalsFromLollipopHeaders } from "../lollipop";
import { ISessionStorage } from "../../services/ISessionStorage";

export const expressLollipopMiddleware: (
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage
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
                  O.toUndefined(user)?.fiscal_code
                ),
                TE.map((lollipopLocals) => {
                  // eslint-disable-next-line functional/immutable-data
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
