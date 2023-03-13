import { FiscalCode } from "@pagopa/io-functions-app-sdk/FiscalCode";
import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import {
  IResponseErrorValidation,
  ResponseErrorValidation
} from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { withValidatedOrValidationError } from "../utils/responses";
import { AssertionRef } from "../../generated/lollipop-api/AssertionRef";
import { AssertionType } from "../../generated/lollipop-api/AssertionType";
import { JwkPubKeyToken } from "../../generated/lollipop-api/JwkPubKeyToken";
import { ResLocals } from "../utils/express";
import { LollipopMethod } from "../../generated/lollipop/LollipopMethod";
import { LollipopOriginalURL } from "../../generated/lollipop/LollipopOriginalURL";
import { LollipopSignature } from "../../generated/lollipop/LollipopSignature";
import { LollipopContentDigest } from "../../generated/lollipop/LollipopContentDigest";
import { LollipopSignatureInput } from "../../generated/lollipop/LollipopSignatureInput";
import LollipopService from "../services/lollipopService";

export interface LollipopParams {
  readonly isLollipopEnabled: boolean;
  readonly lollipopService: LollipopService;
}

export const LollipopRequiredHeaders = t.intersection([
  t.type({
    signature: LollipopSignature,
    ["signature-input"]: LollipopSignatureInput,
    ["x-pagopa-lollipop-original-method"]: LollipopMethod,
    ["x-pagopa-lollipop-original-url"]: LollipopOriginalURL
  }),
  t.partial({ ["content-digest"]: LollipopContentDigest })
]);
export type LollipopRequiredHeaders = t.TypeOf<typeof LollipopRequiredHeaders>;

export const LollipopLocalsType = t.intersection([
  LollipopRequiredHeaders,
  t.type({
    ["x-pagopa-lollipop-assertion-ref"]: AssertionRef,
    ["x-pagopa-lollipop-assertion-type"]: AssertionType,
    ["x-pagopa-lollipop-auth-jwt"]: NonEmptyString,
    ["x-pagopa-lollipop-public-key"]: JwkPubKeyToken,
    ["x-pagopa-lollipop-user-id"]: FiscalCode
  }),
  t.partial({
    body: t.any,
    ["content-digest"]: LollipopContentDigest
  })
]);
export type LollipopLocalsType = t.TypeOf<typeof LollipopLocalsType>;

type LollipopLocalsWithBody = LollipopLocalsType & {
  readonly body: Buffer;
  readonly ["content-digest"]: LollipopContentDigest;
};

/**
 * Utility function that validate locals to check if all
 * the properties required for lollipop are present.
 * The type guard is used to keep unchanged the original locals.
 * If the type doesn't match a IResponseErrorValidation is returned on left.
 *
 * @param locals express res.locals vars injected by toExpressHandler middleware
 */
export const withLollipopLocals = <T extends ResLocals>(
  locals?: T
): E.Either<IResponseErrorValidation, LollipopLocalsType> =>
  pipe(
    locals,
    E.fromPredicate(LollipopLocalsType.is, () =>
      ResponseErrorValidation("Bad request", "Error initializiang lollipop")
    )
  );

/**
 * Verify that locals validated by withLollipopLocals utility
 * contains a raw body.
 * If the validation fails a IResponseErrorValidation is returned on left.
 *
 * @example
 * ```
 * pipe(
 *   locals,
 *   withLollipopLocals,
 *   E.chain(withRequiredRawBody)
 * )
 * ```
 *
 * @param locals locals validated by withLollipopLocals
 */
export const withRequiredRawBody = (
  locals?: LollipopLocalsType
): E.Either<IResponseErrorValidation, LollipopLocalsWithBody> =>
  pipe(
    locals,
    E.fromPredicate(
      (l): l is LollipopLocalsWithBody =>
        l?.body !== undefined && l?.["content-digest"] !== undefined,
      () =>
        ResponseErrorValidation(
          "Bad request",
          "Missing required body or content-digest"
        )
    )
  );

/**
 * Take a express request and returns in callback validated
 * lollipop required headers with an `exact` decoding, stripping away
 * additional headers.
 * If the validation fails a IResponseErrorValidation is returned.
 *
 * @param req the express Request
 * @param f the callback
 */
export const withLollipopHeadersFromRequest = async <T>(
  req: express.Request,
  f: (lollipopHeaders: LollipopRequiredHeaders) => Promise<T>
): Promise<IResponseErrorValidation | T> =>
  withValidatedOrValidationError(
    t.exact(LollipopRequiredHeaders).decode(req.headers),
    f
  );
