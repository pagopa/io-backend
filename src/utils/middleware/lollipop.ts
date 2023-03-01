import { Request, Response, NextFunction } from "express";
import * as TE from "fp-ts/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";
import { ISessionStorage } from "src/services/ISessionStorage";
import * as E from "fp-ts/Either";
import { ulid } from "ulid";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withUserFromRequest } from "../../types/user";
import { LollipopApiClient } from "../../clients/lollipop";
import {
  LollipopLocals,
  withLollipopHeadersFromRequest
} from "../../types/lollipop";

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
                () => sessionStorage.getLollipopAssertionRefForUser(user),
                E.toError
              ),
              TE.chainEitherK(identity),
              TE.mapLeft(() =>
                ResponseErrorInternal("Error retrieving the assertionRef")
              ),
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
                  () =>
                    ResponseErrorInternal(
                      "Error calling the Lollipop function service"
                    )
                )
              ),
              TE.chainW(
                flow(
                  TE.fromEither,
                  TE.mapLeft(_ =>
                    ResponseErrorInternal(
                      "Unexpected response from lollipop service"
                    )
                  ),
                  TE.chainW(lollipopRes =>
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
                const lollipopParams: LollipopLocals = {
                  assertionRef: lcParams.assertion_ref,
                  assertionType: lcParams.assertion_type,
                  authJwt: lcParams.lc_authentication_bearer,
                  publicKey: lcParams.pub_key,
                  userId: user.fiscal_code,
                  ...lollipopHeaders
                };
                // eslint-disable-next-line functional/immutable-data
                res.locals = { ...res.locals, ...lollipopParams };
              }),
              TE.toUnion
            )()
          )
        ),
      () => ResponseErrorInternal("Error executing middleware")
    ),
    TE.chainW(maybeErrorResponse =>
      maybeErrorResponse === undefined
        ? TE.of(void 0)
        : TE.left(maybeErrorResponse)
    ),
    TE.mapLeft(response => response.apply(res)),
    TE.map(() => next()),
    TE.toUnion
  )();
