import { sha256 } from "@pagopa/io-functions-commons/dist/src/utils/crypto";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { eventLog } from "@pagopa/winston-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Errors } from "io-ts";
import { ulid } from "ulid";

import { UserIdentity } from "../../generated/io-auth/UserIdentity";
import { RCConfigurationPublic } from "../../generated/io-messages-api/RCConfigurationPublic";
import { LollipopSignatureInput } from "../../generated/lollipop/LollipopSignatureInput";
import { LcParams } from "../../generated/lollipop-api/LcParams";
import { LollipopApiClient } from "../clients/lollipop";
import {
  LollipopLocalsType,
  LollipopRequiredHeaders,
  Thumbprint,
  getAlgoFromAssertionRef
} from "../types/lollipop";
import { log } from "./logger";

type ErrorsResponses =
  | IResponseErrorInternal
  | IResponseErrorForbiddenNotAuthorized;

const LOLLIPOP_SIGN_ERROR_EVENT_NAME = "lollipop.error.sign";
const NONCE_REGEX = new RegExp(';?nonce="([^"]+)";?');
// Take the first occurrence of the field keyid into the signature-params
const KEY_ID_REGEX = new RegExp(';?keyid="([^"]+)";?');

const getNonceOrUlid = (
  lollipopSignatureInput: LollipopSignatureInput
): NonEmptyString => {
  // The nonce value must be the first regex group
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, nonce, ...__] = NONCE_REGEX.exec(lollipopSignatureInput) ?? [
    null,
    ulid()
  ];
  return nonce as NonEmptyString;
};

export const getKeyThumbprintFromSignature = (
  lollipopSignatureInput: LollipopSignatureInput
): E.Either<Errors, Thumbprint> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, thumbprint, ...__] = KEY_ID_REGEX.exec(lollipopSignatureInput) ?? [
    null,
    null
  ];
  return Thumbprint.decode(thumbprint);
};

export const checkIfLollipopIsEnabled = (
  fiscalCode: FiscalCode,
  remoteContentConfiguration: RCConfigurationPublic
) =>
  pipe(
    TE.of(remoteContentConfiguration),
    eventLog.taskEither.info((config) => [
      `Third party lollipop configuration`,
      {
        isLollipopDisabledFor: config.disable_lollipop_for.includes(fiscalCode),
        isLollipopEnabled: config.is_lollipop_enabled,
        name: "lollipop.status.info"
      }
    ]),
    TE.map(
      (config) =>
        config.is_lollipop_enabled &&
        !config.disable_lollipop_for.includes(fiscalCode)
    )
  );

/**
 * Retrieves Lollipop LC parameters if the user has a valid Lollipop session.
 */
export const extractLollipopLocalsFromLollipopHeaders = (
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  lollipopHeaders: LollipopRequiredHeaders,
  user: UserIdentity
) =>
  pipe(
    TE.of(getNonceOrUlid(lollipopHeaders["signature-input"])),
    TE.bindTo("operationId"),
    TE.bind("keyThumbprint", ({ operationId }) =>
      pipe(
        getKeyThumbprintFromSignature(lollipopHeaders["signature-input"]),
        eventLog.either.errorLeft(() => [
          `AssertionRef in signature-input is missing or invalid`,
          {
            fiscal_code: sha256(user.fiscal_code),
            name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
            operation_id: operationId
          }
        ]),
        E.mapLeft(() =>
          ResponseErrorInternal("Invalid assertionRef in signature params")
        ),
        TE.fromEither
      )
    ),
    TE.bindW("assertionRef", ({ operationId, keyThumbprint }) =>
      pipe(
        TE.of(user.assertion_ref),
        TE.chainW(TE.fromNullable(ResponseErrorForbiddenNotAuthorized)),
        eventLog.taskEither.errorLeft(() => [
          `lollipopMiddleware| error: AssertionRef is missing`,
          {
            fiscal_code: sha256(user.fiscal_code),
            name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
            operation_id: operationId
          }
        ]),
        TE.chainW(
          flow(
            TE.fromPredicate(
              (assertionRef) =>
                assertionRef ===
                `${getAlgoFromAssertionRef(assertionRef)}-${keyThumbprint}`,
              () => ResponseErrorForbiddenNotAuthorized
            ),
            eventLog.taskEither.errorLeft(() => [
              `AssertionRef is different from stored one`,
              {
                fiscal_code: sha256(user.fiscal_code),
                name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
                operation_id: operationId
              }
            ])
          )
        )
      )
    ),
    TE.bindW("generateLCParamsResponse", ({ assertionRef, operationId }) =>
      pipe(
        TE.tryCatch(
          () =>
            lollipopClient.generateLCParams({
              assertion_ref: assertionRef,
              body: {
                operation_id: operationId
              }
            }),
          E.toError
        ),
        eventLog.taskEither.errorLeft((error) => [
          `Error trying to call the Lollipop function service | ${error.message}`,
          {
            assertion_ref: assertionRef,
            fiscal_code: sha256(user.fiscal_code),
            name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
            operation_id: operationId
          }
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
    TE.chain(({ generateLCParamsResponse, assertionRef, operationId }) =>
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
            operation_id: operationId
          }
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
              ? TE.of<ErrorsResponses, LcParams>(lollipopRes.value)
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
                operation_id: operationId
              }
            ])
          )
        )
      )
    ),
    TE.map(
      (lcParams) =>
        ({
          ["x-pagopa-lollipop-assertion-ref"]: lcParams.assertion_ref,
          ["x-pagopa-lollipop-assertion-type"]: lcParams.assertion_type,
          ["x-pagopa-lollipop-auth-jwt"]: lcParams.lc_authentication_bearer,
          ["x-pagopa-lollipop-public-key"]: lcParams.pub_key,
          ["x-pagopa-lollipop-user-id"]: user.fiscal_code,
          ...lollipopHeaders
        }) as LollipopLocalsType
    ),
    eventLog.taskEither.info((lcLocals) => [
      "Lollipop locals to be sent to third party api",
      { ...Object.keys(lcLocals), name: "lollipop.locals.info" }
    ])
  );
