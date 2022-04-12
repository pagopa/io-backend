import * as express from "express";
import { PaymentFaultEnum } from "generated/pagopa-proxy/PaymentFault";
import { PaymentFaultV2Enum } from "generated/pagopa-proxy/PaymentFaultV2";
import { PaymentProblemJson } from "generated/pagopa-proxy/PaymentProblemJson";
import * as t from "io-ts";
import {
  IWithinRangeIntegerTag,
  WithinRangeInteger
} from "@pagopa/ts-commons/lib/numbers";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import {
  HttpStatusCodeEnum,
  IResponse,
  IResponseErrorInternal,
  IResponseErrorValidation,
  ResponseErrorGeneric,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation
} from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import { errorsToError } from "./errorsFormatter";

/**
 * Interface for a no content response returning a empty object.
 */
export interface IResponseNoContent extends IResponse<"IResponseNoContent"> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  readonly value: {};
}
/**
 * Returns a no content json response.
 */
export function ResponseNoContent(): IResponseNoContent {
  return {
    apply: (res: express.Response): unknown => res.status(204).json({}),
    kind: "IResponseNoContent",
    value: {}
  };
}

/**
 * A response error for when a feature has been dismissed.
 */
export const ResponseErrorDismissed = ResponseErrorNotFound(
  "Expired resource",
  "The resource you asked for is no longer available"
);

/**
 * Transforms async failures into internal errors
 */
export const withCatchAsInternalError = <T>(
  f: () => Promise<T>,
  message: string = "Exception while calling upstream API (likely a timeout)."
): Promise<T | IResponseErrorInternal> =>
  f().catch(_ => {
    // eslint-disable-next-line no-console
    console.error(_);
    return ResponseErrorInternal(`${message} [${_}]`);
  });

export const unhandledResponseStatus = (
  status: number
): IResponseErrorInternal =>
  ResponseErrorInternal(`unhandled API response status [${status}]`);

/**
 * Calls the provided function with the valid response, or else returns an
 * IResponseErrorInternal with the validation errors.
 */
export const withValidatedOrInternalError = <T, U>(
  validated: t.Validation<T>,
  f: (p: T) => U
): U | IResponseErrorInternal =>
  validated.isLeft()
    ? ResponseErrorInternal(
        errorsToReadableMessages(validated.value).join(" / ")
      )
    : f(validated.value);

/**
 * Calls the provided function with the valid response, or else returns an
 * IResponseErrorValidation with the validation errors.
 */
export const withValidatedOrValidationError = <T, U>(
  response: t.Validation<T>,
  f: (p: T) => U
): U | IResponseErrorValidation =>
  response.isLeft()
    ? ResponseErrorValidation(
        "Bad request",
        errorsToReadableMessages(response.value).join(" / ")
      )
    : f(response.value);

/**
 * Interface for unauthorized error response.
 */
export interface IResponseErrorUnauthorizedForLegalReasons
  extends IResponse<"IResponseErrorUnauthorizedForLegalReasons"> {
  readonly detail: string;
}
/**
 * Returns an unauthorized error response with status code 451.
 */
export function ResponseErrorUnauthorizedForLegalReasons(
  title: string,
  detail: string
): IResponseErrorUnauthorizedForLegalReasons {
  return {
    ...ResponseErrorGeneric(HttpStatusCodeEnum.HTTP_STATUS_451, title, detail),
    ...{
      detail: `${title}: ${detail}`,
      kind: "IResponseErrorUnauthorizedForLegalReasons"
    }
  };
}

export const ResponseErrorStatusNotDefinedInSpec = (response: never) =>
  // This case should not happen, so response is of type never.
  // However, the underlying api may not follow the specs so we might trace the unhandled status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unhandledResponseStatus((response as any).status);

export const ResponseErrorUnexpectedAuthProblem = () =>
  // This case can only happen because of misconfiguration, thus it might be considered an error
  ResponseErrorInternal("Underlying API fails with an unexpected 401");

export type HttpStatusCode = t.TypeOf<typeof HttpStatusCode>;
export const HttpStatusCode = t.union([
  WithinRangeInteger<100, 599, IWithinRangeIntegerTag<100, 599>>(100, 599),
  t.literal(599)
]);

export type IResponsePaymentInternalError = IResponse<"IResponseErrorInternal">;

/**
 * Returns a 500 with json response.
 */
export const ResponsePaymentError = (
  detail: PaymentFaultEnum,
  detailV2: PaymentFaultV2Enum
): IResponsePaymentInternalError => {
  const problem: PaymentProblemJson = {
    detail,
    detail_v2: detailV2,
    status: HttpStatusCodeEnum.HTTP_STATUS_500 as HttpStatusCode,
    title: "Internal server error"
  };
  return {
    apply: res =>
      res
        .status(HttpStatusCodeEnum.HTTP_STATUS_500)
        .set("Content-Type", "application/problem+json")
        .json(problem),
    kind: "IResponseErrorInternal"
  };
};

/**
 * Interface for a successful response returning a octet stream object.
 */
export interface IResponseSuccessOctet
  extends IResponse<"IResponseSuccessOctet"> {
  readonly value: unknown;
}

/**
 * Returns a successful octet stream response.
 *
 * @param o The object to return to the client
 */
export const ResponseSuccessOctet = (o: Buffer): IResponseSuccessOctet => ({
  apply: res =>
    res
      .status(HttpStatusCodeEnum.HTTP_STATUS_200)
      .set("Content-Type", "application/octet-stream")
      .end(o),
  kind: "IResponseSuccessOctet",
  value: o
});

export const wrapValidationWithInternalError: <A>(
  fa: t.Validation<A>
) => TE.TaskEither<IResponseErrorInternal, A> = fa =>
  TE.fromEither(fa)
    .mapLeft(errorsToError)
    .mapLeft(e => ResponseErrorInternal(e.message));
