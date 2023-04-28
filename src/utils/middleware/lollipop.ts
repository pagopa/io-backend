import { Request, Response, NextFunction } from "express";
import * as TE from "fp-ts/TaskEither";
import { identity, pipe } from "fp-ts/lib/function";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/Either";
import { ulid } from "ulid";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { eventLog } from "@pagopa/winston-ts";
import { sha256 } from "@pagopa/io-functions-commons/dist/src/utils/crypto";
import { ISessionStorage } from "../../services/ISessionStorage";
import { withUserFromRequest } from "../../types/user";
import { LollipopApiClient } from "../../clients/lollipop";
import {
  LollipopLocalsType,
  withLollipopHeadersFromRequest,
} from "../../types/lollipop";
import { log } from "../logger";
import { LollipopSignatureInput } from "../../../generated/lollipop/LollipopSignatureInput";
import { LcParams } from "../../../generated/lollipop-api/LcParams";

type ErrorsResponses =
  | IResponseErrorInternal
  | IResponseErrorForbiddenNotAuthorized;

const LOLLIPOP_SIGN_ERROR_EVENT_NAME = "lollipop.error.sign";
const NONCE_REGEX = new RegExp(';?nonce="([^"]+)";?');

const getNonceOrUlid = (
  lollipopSignatureInput: LollipopSignatureInput
): NonEmptyString => {
  // The nonce value must be the first regex group
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, nonce, ...__] = NONCE_REGEX.exec(lollipopSignatureInput) ?? [
    null,
    ulid(),
  ];
  return nonce as NonEmptyString;
};

export const expressLollipopMiddleware: (
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
                TE.of(getNonceOrUlid(lollipopHeaders["signature-input"])),
                TE.bindTo("operationId"),
                TE.bind("assertionRef", ({ operationId }) =>
                  pipe(
                    TE.tryCatch(
                      () =>
                        sessionStorage.getLollipopAssertionRefForUser(
                          user.fiscal_code
                        ),
                      E.toError
                    ),
                    TE.chainEitherK(identity),
                    eventLog.taskEither.errorLeft((err) => [
                      `An error occurs retrieving the assertion ref from Redis | ${err.message}`,
                      {
                        fiscal_code: sha256(user.fiscal_code),
                        name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
                        operation_id: operationId,
                      },
                    ]),
                    TE.mapLeft((err) => {
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
                    )
                  )
                ),
                TE.bindW(
                  "generateLCParamsResponse",
                  ({ assertionRef, operationId }) =>
                    pipe(
                      TE.tryCatch(
                        () =>
                          lollipopClient.generateLCParams({
                            assertion_ref: assertionRef,
                            body: {
                              operation_id: operationId,
                            },
                          }),
                        E.toError
                      ),
                      eventLog.taskEither.errorLeft((error) => [
                        `Error trying to call the Lollipop function service | ${error.message}`,
                        {
                          assertion_ref: assertionRef,
                          fiscal_code: sha256(user.fiscal_code),
                          name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
                          operation_id: operationId,
                        },
                      ]),
                      TE.mapLeft((err) => {
                        log.error(
                          "lollipopMiddleware|error trying to call the Lollipop function service [%s]",
                          err.message
                        );
                        return ResponseErrorInternal(
                          "Error calling the Lollipop function service"
                        );
                      })
                    )
                ),
                TE.chain(
                  ({ generateLCParamsResponse, assertionRef, operationId }) =>
                    pipe(
                      generateLCParamsResponse,
                      TE.fromEither,
                      eventLog.taskEither.errorLeft((err) => [
                        `Unexpected response from the lollipop function service | ${readableReportSimplified(
                          err
                        )}`,
                        {
                          assertion_ref: assertionRef,
                          fiscal_code: sha256(user.fiscal_code),
                          name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
                          operation_id: operationId,
                        },
                      ]),
                      TE.mapLeft((err) => {
                        log.error(
                          "lollipopMiddleware|error calling the Lollipop function service [%s]",
                          readableReportSimplified(err)
                        );
                        return ResponseErrorInternal(
                          "Unexpected response from lollipop service"
                        );
                      }),
                      TE.chainW((lollipopRes) =>
                        pipe(
                          lollipopRes.status === 200
                            ? TE.of<ErrorsResponses, LcParams>(
                                lollipopRes.value
                              )
                            : lollipopRes.status === 403
                            ? TE.left(ResponseErrorForbiddenNotAuthorized)
                            : TE.left(
                                ResponseErrorInternal(
                                  "The lollipop service returns an error"
                                )
                              ),
                          eventLog.taskEither.errorLeft((errorResponse) => [
                            `The lollipop function service returns an error | ${errorResponse.kind}`,
                            {
                              assertion_ref: assertionRef,
                              fiscal_code: sha256(user.fiscal_code),
                              name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
                              operation_id: operationId,
                            },
                          ])
                        )
                      )
                    )
                ),
                TE.map((lcParams) => {
                  const lollipopParams: LollipopLocalsType = {
                    ["x-pagopa-lollipop-assertion-ref"]: lcParams.assertion_ref,
                    ["x-pagopa-lollipop-assertion-type"]:
                      lcParams.assertion_type,
                    ["x-pagopa-lollipop-auth-jwt"]:
                      lcParams.lc_authentication_bearer,
                    ["x-pagopa-lollipop-public-key"]: lcParams.pub_key,
                    ["x-pagopa-lollipop-user-id"]: user.fiscal_code,
                    ...lollipopHeaders,
                  };
                  // eslint-disable-next-line functional/immutable-data
                  res.locals = { ...res.locals, ...lollipopParams };
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
