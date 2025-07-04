import {
  IResponseErrorValidation,
  ResponseErrorValidation
} from "@pagopa/ts-commons/lib/responses";
import {
  FiscalCode,
  NonEmptyString,
  PatternString
} from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { AssertionRefSha256 } from "../../generated/backend/AssertionRefSha256";
import { AssertionRefSha384 } from "../../generated/backend/AssertionRefSha384";
import { AssertionRefSha512 } from "../../generated/backend/AssertionRefSha512";
import { LollipopContentDigest } from "../../generated/lollipop/LollipopContentDigest";
import { LollipopMethod } from "../../generated/lollipop/LollipopMethod";
import { LollipopOriginalURL } from "../../generated/lollipop/LollipopOriginalURL";
import { LollipopSignature } from "../../generated/lollipop/LollipopSignature";
import { LollipopSignatureInput } from "../../generated/lollipop/LollipopSignatureInput";
import { AssertionRef } from "../../generated/lollipop-api/AssertionRef";
import { AssertionType } from "../../generated/lollipop-api/AssertionType";
import {
  JwkPubKeyHashAlgorithm,
  JwkPubKeyHashAlgorithmEnum
} from "../../generated/lollipop-api/JwkPubKeyHashAlgorithm";
import { JwkPubKeyToken } from "../../generated/lollipop-api/JwkPubKeyToken";
import { ResLocals } from "../utils/express";
import { withValidatedOrValidationError } from "../utils/responses";

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

const Sha256Thumbprint = PatternString("^([A-Za-z0-9-_=]{1,44})$");
const Sha384Thumbprint = PatternString("^([A-Za-z0-9-_=]{1,66})$");
const Sha512Thumbprint = PatternString("^([A-Za-z0-9-_=]{1,88})$");

export const Thumbprint = t.union(
  [Sha256Thumbprint, Sha384Thumbprint, Sha512Thumbprint],
  "Thumbprint"
);

export type Thumbprint = t.TypeOf<typeof Thumbprint>;

export const algoToAssertionRefSet = new Set([
  { algo: JwkPubKeyHashAlgorithmEnum.sha256, type: AssertionRefSha256 },
  { algo: JwkPubKeyHashAlgorithmEnum.sha384, type: AssertionRefSha384 },
  { algo: JwkPubKeyHashAlgorithmEnum.sha512, type: AssertionRefSha512 }
]);

export const getAlgoFromAssertionRef = (
  assertionRef: AssertionRef
): JwkPubKeyHashAlgorithm =>
  pipe(
    Array.from(algoToAssertionRefSet),
    (ar) => ar.find((entry) => entry.type.is(assertionRef)),
    O.fromNullable,
    O.map((pubKeyHashAlgo) => pubKeyHashAlgo.algo),
    O.getOrElseW(() => void 0 as never)
  );
