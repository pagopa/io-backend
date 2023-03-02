import { FiscalCode } from "@pagopa/io-functions-app-sdk/FiscalCode";
import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import { IResponseErrorValidation } from "@pagopa/ts-commons/lib/responses";
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
  originalMethod: LollipopMethod,
  originalUrl: LollipopOriginalURL,
  signature: LollipopSignature,
  signatureParams: LollipopSignatureInput
});
export type LollipopRequiredHeaders = t.TypeOf<typeof LollipopRequiredHeaders>;

export type LollipopLocals = ResLocals & {
  readonly assertionRef: AssertionRef;
  readonly assertionType: AssertionType;
  readonly userId: FiscalCode;
  readonly publicKey: JwkPubKeyToken;
  readonly authJwt: NonEmptyString;
  readonly originalMethod: LollipopMethod;
  readonly originalUrl: LollipopOriginalURL;
  readonly signatureParams: LollipopSignatureInput;
  readonly signature: LollipopSignature;
  readonly body?: any;
  readonly digest?: any;
};

export const withLollipopHeadersFromRequest = async <T>(
  req: express.Request,
  f: (lollipopHeaders: LollipopRequiredHeaders) => Promise<T>
): Promise<IResponseErrorValidation | T> =>
  withValidatedOrValidationError(
    LollipopRequiredHeaders.decode({
      originalMethod: req.header("X-PagoPa-LolliPoP-Original-Method"),
      originalUrl: req.header("x-pagopa-lollipop-original-url"),
      signature: req.header("signature"),
      signatureParams: req.header("signature-input")
    }),
    f
  );
