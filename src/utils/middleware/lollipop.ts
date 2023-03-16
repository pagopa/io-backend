import { Request, Response, NextFunction } from "express";
import * as TE from "fp-ts/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/Either";
import { ulid } from "ulid";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { ISessionStorage } from "../../services/ISessionStorage";
import { withUserFromRequest } from "../../types/user";
import { LollipopApiClient } from "../../clients/lollipop";
import {
  LollipopLocalsType,
  withLollipopHeadersFromRequest
} from "../../types/lollipop";
import { log } from "../logger";

type ErrorsResponses =
  | IResponseErrorInternal
  | IResponseErrorForbiddenNotAuthorized;

export const lollipopMiddleware: (
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage
) => (req: Request, res: Response, next: NextFunction) => Promise<void> = (
  lollipopClient,
  sessionStorage
) => (req, res, next) =>
  pipe(
    TE.tryCatch(
      () =>
        withUserFromRequest(req, async user =>
          withLollipopHeadersFromRequest(req, async lollipopHeaders =>
            pipe(
              TE.tryCatch(
                () => sessionStorage.getLollipopAssertionRefForUser(user.fiscal_code),
                E.toError
              ),
              TE.chainEitherK(identity),
              TE.mapLeft(err => {
                log.error(
                  "lollipopMiddleware|error reading the assertionRef from redis [%s]",
                  err.message
                );
                return ResponseErrorInternal(
                  "Error retrieving the assertionRef"
                );
              }),
              TE.chainW(
                TE.fromOption(() => ResponseErrorForbiddenNotAuthorized)
              ),
              TE.bindTo("assertionRef"),
              TE.bind("operationId", () => TE.of(ulid() as NonEmptyString)),
              TE.chainW(({ assertionRef, operationId }) =>
                TE.tryCatch(
                  () =>
                    lollipopClient.generateLCParams({
                      assertion_ref: assertionRef,
                      body: {
                        operation_id: operationId
                      }
                    }),
                  err => {
                    log.error(
                      "lollipopMiddleware|error trying to call the Lollipop function service [%s]",
                      E.toError(err).message
                    );
                    return ResponseErrorInternal(
                      "Error calling the Lollipop function service"
                    );
                  }
                )
              ),
              TE.chain(
                flow(
                  TE.fromEither,
                  TE.mapLeft(err => {
                    log.error(
                      "lollipopMiddleware|error calling the Lollipop function service [%s]",
                      readableReportSimplified(err)
                    );
                    return ResponseErrorInternal(
                      "Unexpected response from lollipop service"
                    );
                  }),
                  TE.chain(lollipopRes =>
                    lollipopRes.status === 200
                      ? TE.of(lollipopRes.value)
                      : lollipopRes.status === 403
                      ? TE.left(
                          ResponseErrorForbiddenNotAuthorized as ErrorsResponses
                        )
                      : TE.left(
                          ResponseErrorInternal(
                            "The lollipop service returns an error"
                          ) as ErrorsResponses
                        )
                  )
                )
              ),
              TE.map(lcParams => {
                const lollipopParams: LollipopLocalsType = {
                  ["x-pagopa-lollipop-assertion-ref"]: lcParams.assertion_ref,
                  ["x-pagopa-lollipop-assertion-type"]: lcParams.assertion_type,
                  ["x-pagopa-lollipop-auth-jwt"]:
                    lcParams.lc_authentication_bearer,
                  ["x-pagopa-lollipop-public-key"]: lcParams.pub_key,
                  ["x-pagopa-lollipop-user-id"]: user.fiscal_code,
                  ...lollipopHeaders
                };
                // eslint-disable-next-line functional/immutable-data
                res.locals = { ...res.locals, ...lollipopParams };
              }),
              TE.toUnion
            )()
          )
        ),
      err => {
        log.error(
          "lollipopMiddleware|error executing the middleware [%s]",
          E.toError(err).message
        );
        return ResponseErrorInternal("Error executing middleware");
      }
    ),
    TE.chain(maybeErrorResponse =>
      maybeErrorResponse === undefined
        ? TE.of(void 0)
        : TE.left(maybeErrorResponse)
    ),
    TE.mapLeft(response => response.apply(res)),
    TE.map(() => next()),
    TE.toUnion
  )();
