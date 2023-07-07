import { flow, identity, pipe } from "fp-ts/lib/function";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/Either";
import { ulid } from "ulid";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { eventLog } from "@pagopa/winston-ts";
import { sha256 } from "@pagopa/io-functions-commons/dist/src/utils/crypto";
import { ServiceId } from "@pagopa/io-functions-app-sdk/ServiceId";
import { Errors } from "io-ts";
import * as O from "fp-ts/Option";
import { withoutUndefinedValues } from "@pagopa/ts-commons/lib/types";
import { AssertionRef } from "generated/backend/AssertionRef";
import * as RA from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";
import { ISessionStorage } from "../services/ISessionStorage";
import { LollipopApiClient } from "../clients/lollipop";
import {
  LollipopLocalsType,
  LollipopRequiredHeaders,
  Thumbprint,
  getAlgoFromAssertionRef,
} from "../types/lollipop";
import { LollipopSignatureInput } from "../../generated/lollipop/LollipopSignatureInput";
import { LcParams } from "../../generated/lollipop-api/LcParams";
import { log } from "./logger";
import { ThirdPartyConfigList } from "./thirdPartyConfig";

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
    ulid(),
  ];
  return nonce as NonEmptyString;
};

export const getKeyThumbprintFromSignature = (
  lollipopSignatureInput: LollipopSignatureInput
): E.Either<Errors, Thumbprint> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, thumbprint, ...__] = KEY_ID_REGEX.exec(lollipopSignatureInput) ?? [
    null,
    null,
  ];
  return Thumbprint.decode(thumbprint);
};

export const checkIfLollipopIsEnabled = (
  thirdPartyConfigList: ThirdPartyConfigList,
  fiscalCode: FiscalCode,
  serviceId: ServiceId
) =>
  pipe(
    thirdPartyConfigList.find((c) => c.serviceId === serviceId),
    TE.fromNullable(
      Error(`Cannot find configuration for service ${serviceId}`)
    ),
    eventLog.taskEither.info((config) => [
      `Third party lollipop configuration`,
      {
        isLollipopDisabledFor: config.disableLollipopFor.includes(fiscalCode),
        isLollipopEnabled: config.isLollipopEnabled,
        name: "lollipop.status.info",
      },
    ]),
    TE.map(
      (config) =>
        config.isLollipopEnabled &&
        !config.disableLollipopFor.includes(fiscalCode)
    )
  );
const getAndValidateAssertionRefForUser = (
  sessionStorage: ISessionStorage,
  fiscalCode: FiscalCode,
  operationId: NonEmptyString,
  keyThumbprint: Thumbprint
): TE.TaskEither<
  IResponseErrorInternal | IResponseErrorForbiddenNotAuthorized,
  AssertionRef
> =>
  pipe(
    TE.tryCatch(
      () => sessionStorage.getLollipopAssertionRefForUser(fiscalCode),
      E.toError
    ),
    TE.chainEitherK(identity),
    eventLog.taskEither.errorLeft((err) => [
      `An error occurs retrieving the assertion ref from Redis | ${err.message}`,
      {
        fiscal_code: sha256(fiscalCode),
        name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
        operation_id: operationId,
      },
    ]),
    TE.mapLeft((err) => {
      log.error(
        "lollipopMiddleware|error reading the assertionRef from redis [%s]",
        err.message
      );
      return ResponseErrorInternal("Error retrieving the assertionRef");
    }),
    TE.chainW(TE.fromOption(() => ResponseErrorForbiddenNotAuthorized)),
    TE.chainW(
      flow(
        TE.fromPredicate(
          (assertionRef) =>
            assertionRef ===
            `${getAlgoFromAssertionRef(assertionRef)}${keyThumbprint}`,
          () => ResponseErrorForbiddenNotAuthorized
        ),
        eventLog.taskEither.errorLeft(() => [
          `AssertionRef is different from stored one`,
          {
            fiscal_code: sha256(fiscalCode),
            name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
            operation_id: operationId,
          },
        ])
      )
    )
  );

/* eslint-disable sonarjs/no-identical-functions */
/**
 * @deprecated
 */
export const extractLollipopLocalsFromLollipopHeadersLegacy = (
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage,
  fiscalCode: FiscalCode,
  lollipopHeaders: LollipopRequiredHeaders
) =>
  pipe(
    // eslint-disable-next-line sonarjs/no-duplicate-string
    TE.of(getNonceOrUlid(lollipopHeaders["signature-input"])),
    TE.bindTo("operationId"),
    TE.bind("assertionRef", ({ operationId }) =>
      pipe(
        TE.tryCatch(
          () => sessionStorage.getLollipopAssertionRefForUser(fiscalCode),
          E.toError
        ),
        TE.chainEitherK(identity),
        eventLog.taskEither.errorLeft((err) => [
          `An error occurs retrieving the assertion ref from Redis | ${err.message}`,
          {
            fiscal_code: sha256(fiscalCode),
            name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
            operation_id: operationId,
          },
        ]),
        TE.mapLeft((err) => {
          log.error(
            "lollipopMiddleware|error reading the assertionRef from redis [%s]",
            err.message
          );
          return ResponseErrorInternal("Error retrieving the assertionRef");
        }),
        TE.chainW(TE.fromOption(() => ResponseErrorForbiddenNotAuthorized))
      )
    ),
    TE.bindW("generateLCParamsResponse", ({ assertionRef, operationId }) =>
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
            fiscal_code: sha256(fiscalCode),
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
            fiscal_code: sha256(fiscalCode),
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
              ? TE.of<ErrorsResponses, LcParams>(lollipopRes.value)
              : lollipopRes.status === 403
              ? TE.left(ResponseErrorForbiddenNotAuthorized)
              : TE.left(
                  ResponseErrorInternal("The lollipop service returns an error")
                ),
            eventLog.taskEither.errorLeft((errorResponse) => [
              `The lollipop function service returns an error | ${errorResponse.kind}`,
              {
                assertion_ref: assertionRef,
                fiscal_code: sha256(fiscalCode),
                name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
                operation_id: operationId,
              },
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
          ["x-pagopa-lollipop-user-id"]: fiscalCode,
          ...lollipopHeaders,
        } as LollipopLocalsType)
    ),
    eventLog.taskEither.info((lcLocals) => [
      "Lollipop locals to be sent to third party api",
      { ...Object.keys(lcLocals), name: "lollipop.locals.info" },
    ])
  );

const retrieveLCParams = (
  assertionRef: AssertionRef,
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  operationId: NonEmptyString,
  fiscalCode?: FiscalCode
): TE.TaskEither<
  IResponseErrorForbiddenNotAuthorized | IResponseErrorInternal,
  O.Option<LcParams>
> =>
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
      withoutUndefinedValues({
        assertion_ref: assertionRef,
        fiscal_code: fiscalCode ? sha256(fiscalCode) : undefined,
        name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
        operation_id: operationId,
      }),
    ]),
    TE.mapLeft((err) => {
      log.error(
        "lollipopMiddleware|error trying to call the Lollipop function service [%s]",
        err.message
      );
      return ResponseErrorInternal(
        "Error calling the Lollipop function service"
      );
    }),
    TE.chain(
      flow(
        TE.fromEither,
        eventLog.taskEither.errorLeft((err) => [
          `Unexpected response from the lollipop function service | ${readableReportSimplified(
            err
          )}`,
          withoutUndefinedValues({
            assertion_ref: assertionRef,
            fiscal_code: fiscalCode ? sha256(fiscalCode) : undefined,
            name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
            operation_id: operationId,
          }),
        ]),
        TE.mapLeft((err) => {
          log.error(
            "lollipopMiddleware|error calling the Lollipop function service [%s]",
            readableReportSimplified(err)
          );
          return ResponseErrorInternal(
            "Unexpected response from lollipop service"
          );
        })
      )
    ),
    TE.chainW((lollipopRes) =>
      pipe(
        lollipopRes.status === 200
          ? TE.of<ErrorsResponses, O.Option<LcParams>>(
              O.some(lollipopRes.value)
            )
          : lollipopRes.status === 403
          ? TE.left(ResponseErrorForbiddenNotAuthorized)
          : lollipopRes.status === 404
          ? TE.right(O.none)
          : TE.left(
              ResponseErrorInternal("The lollipop service returns an error")
            ),
        eventLog.taskEither.errorLeft((errorResponse) => [
          `The lollipop function service returns an error | ${errorResponse.kind}`,
          withoutUndefinedValues({
            assertion_ref: assertionRef,
            fiscal_code: fiscalCode ? sha256(fiscalCode) : undefined,
            name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
            operation_id: operationId,
          }),
        ])
      )
    )
  );

export const extractLollipopLocalsFromLollipopHeaders = (
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage,
  lollipopHeaders: LollipopRequiredHeaders,
  fiscalCode?: FiscalCode
): TE.TaskEither<
  IResponseErrorInternal | IResponseErrorForbiddenNotAuthorized,
  LollipopLocalsType
> =>
  pipe(
    TE.of(getNonceOrUlid(lollipopHeaders["signature-input"])),
    TE.bindTo("operationId"),
    TE.bind("keyThumbprint", ({ operationId }) =>
      pipe(
        getKeyThumbprintFromSignature(lollipopHeaders["signature-input"]),
        eventLog.either.errorLeft(() => [
          `AssertionRef in signature-input is missing or invalid`,
          {
            fiscal_code: fiscalCode ? sha256(fiscalCode) : undefined,
            name: LOLLIPOP_SIGN_ERROR_EVENT_NAME,
            operation_id: operationId,
          },
        ]),
        E.mapLeft(() =>
          ResponseErrorInternal("Invalid assertionRef in signature params")
        ),
        TE.fromEither
      )
    ),
    TE.bind("assertionRefSet", ({ keyThumbprint, operationId }) =>
      pipe(
        O.fromNullable(fiscalCode),
        O.map((fc) =>
          pipe(
            getAndValidateAssertionRefForUser(
              sessionStorage,
              fc,
              operationId,
              keyThumbprint
            ),
            TE.map((assertionRef) => [assertionRef])
          )
        ),
        O.getOrElse(() =>
          TE.of([
            `sha256-${keyThumbprint}` as AssertionRef,
            `sha384-${keyThumbprint}` as AssertionRef,
            `sha512-${keyThumbprint}` as AssertionRef,
          ])
        )
      )
    ),
    TE.bindW("lcParams", ({ assertionRefSet, operationId }) =>
      pipe(
        assertionRefSet,
        RA.traverse(TE.ApplicativeSeq)((assertionRef) =>
          pipe(
            retrieveLCParams(
              assertionRef,
              lollipopClient,
              operationId,
              fiscalCode
            ),
            TE.chainW((_) =>
              O.isSome(_) ? TE.left(_.value) : TE.right(O.none)
            )
          )
        ),
        TE.fold(
          (_) => (LcParams.is(_) ? TE.right(_) : TE.left(_)),
          () =>
            TE.left<
              IResponseErrorForbiddenNotAuthorized | IResponseErrorInternal
            >(ResponseErrorInternal("Missing assertion ref"))
        )
      )
    ),
    TE.chainFirst(({ operationId, lcParams, keyThumbprint }) =>
      pipe(
        O.fromNullable(fiscalCode),
        O.map(() => TE.of(true)),
        O.getOrElse(() =>
          pipe(
            getAndValidateAssertionRefForUser(
              sessionStorage,
              lcParams.fiscal_code,
              operationId,
              keyThumbprint
            ),
            TE.map(() => true)
          )
        )
      )
    ),
    TE.map(
      ({ lcParams }) =>
        ({
          ["x-pagopa-lollipop-assertion-ref"]: lcParams.assertion_ref,
          ["x-pagopa-lollipop-assertion-type"]: lcParams.assertion_type,
          ["x-pagopa-lollipop-auth-jwt"]: lcParams.lc_authentication_bearer,
          ["x-pagopa-lollipop-public-key"]: lcParams.pub_key,
          // It's possible to improve security by verifying that the fiscal code from
          // the authorization is equal to the one from the lollipop function
          ["x-pagopa-lollipop-user-id"]: fiscalCode || lcParams.fiscal_code,
          ...lollipopHeaders,
        } as LollipopLocalsType)
    ),
    eventLog.taskEither.info((lcLocals) => [
      "Lollipop locals to be sent to third party api",
      { ...Object.keys(lcLocals), name: "lollipop.locals.info" },
    ])
  );
/* eslint-enable sonarjs/no-identical-functions */
