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
import { LollipopSignatureInput } from "../../generated/lollipop/LollipopSignatureInput";
import LollipopService from "../services/lollipopService";

export interface LollipopParams {
  readonly isLollipopEnabled: boolean;
  readonly lollipopService: LollipopService;
}

export const LollipopRequiredHeaders = t.type({
  signature: LollipopSignature,
  ["signature-input"]: LollipopSignatureInput,
  ["x-pagopa-lollipop-original-method"]: LollipopMethod,
  ["x-pagopa-lollipop-original-url"]: LollipopOriginalURL
});
export type LollipopRequiredHeaders = t.TypeOf<typeof LollipopRequiredHeaders>;

export type LollipopLocals = ResLocals & {
  readonly ["x-pagopa-lollipop-assertion-ref"]: AssertionRef;
  readonly ["x-pagopa-lollipop-assertion-type"]: AssertionType;
  readonly ["x-pagopa-lollipop-user-id"]: FiscalCode;
  readonly ["x-pagopa-lollipop-public-key"]: JwkPubKeyToken;
  readonly ["x-pagopa-lollipop-auth-jwt"]: NonEmptyString;
  readonly ["x-pagopa-lollipop-original-method"]: LollipopMethod;
  readonly ["x-pagopa-lollipop-original-url"]: LollipopOriginalURL;
  readonly ["signature-input"]: LollipopSignatureInput;
  readonly signature: LollipopSignature;
};

type LollipopLocalsWithBody = LollipopLocals & {
  readonly body: ReadableStream<Uint8Array>;
};

export const withRequiredRawBody = (
  locals: LollipopLocals | undefined
): E.Either<IResponseErrorValidation, LollipopLocalsWithBody> =>
  pipe(
    locals,
    E.fromPredicate(
      (l): l is LollipopLocalsWithBody => l?.body !== undefined,
      () => ResponseErrorValidation("Bad request", "Missing required body")
    )
  );

export const withLollipopHeadersFromRequest = async <T>(
  req: express.Request,
  f: (lollipopHeaders: LollipopRequiredHeaders) => Promise<T>
): Promise<IResponseErrorValidation | T> =>
  withValidatedOrValidationError(
    t.exact(LollipopRequiredHeaders).decode(req.headers),
    f
  );
