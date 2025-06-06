import {
  IWithinRangeIntegerTag,
  WithinRangeInteger
} from "@pagopa/ts-commons/lib/numbers";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import {
  HttpStatusCodeEnum,
  IResponse,
  IResponseErrorBadGateway,
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorServiceUnavailable,
  IResponseErrorValidation,
  ResponseErrorGeneric,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { PaymentInfoBadGatewayResponse } from "generated/backend/PaymentInfoBadGatewayResponse";
import { ProblemJson } from "generated/io-messages-api/ProblemJson";
import { PartyConfigurationFaultPaymentProblemJson } from "generated/pagopa-ecommerce/PartyConfigurationFaultPaymentProblemJson";
import { PaymentInfoConflictResponse } from "generated/pagopa-ecommerce/PaymentInfoConflictResponse";
import { PaymentInfoNotFoundResponse } from "generated/pagopa-ecommerce/PaymentInfoNotFoundResponse";
import { PaymentFaultEnum } from "generated/pagopa-proxy/PaymentFault";
import { PaymentFaultV2Enum } from "generated/pagopa-proxy/PaymentFaultV2";
import { PaymentProblemJson } from "generated/pagopa-proxy/PaymentProblemJson";
import * as t from "io-ts";

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
 * Returns a `403` as `Not Found` error
 *
 * @param detail The error message
 */
export function ResponseErrorNotFound403(
  detail: string
): IResponseErrorNotFound {
  return {
    ...ResponseErrorGeneric(
      HttpStatusCodeEnum.HTTP_STATUS_403,
      "Not Found",
      detail
    ),
    kind: "IResponseErrorNotFound"
  };
}

/**
 * Transforms async failures into internal errors
 */
export const withCatchAsInternalError = <T>(
  f: () => Promise<T>,
  message: string = "Exception while calling upstream API (likely a timeout)."
): Promise<T | IResponseErrorInternal> =>
  f().catch((_) => {
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
  E.isLeft(validated)
    ? ResponseErrorInternal(
        errorsToReadableMessages(validated.left).join(" / ")
      )
    : f(validated.right);

/**
 * Calls the provided function with the valid response, or else returns an
 * IResponseErrorValidation with the validation errors.
 */
export const withValidatedOrValidationError = <T, U>(
  response: t.Validation<T>,
  f: (p: T) => U
): U | IResponseErrorValidation =>
  E.isLeft(response)
    ? ResponseErrorValidation(
        "Bad request",
        errorsToReadableMessages(response.left).join(" / ")
      )
    : f(response.right);

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

/**
 * Interface for 401 unauthorized
 */
export interface IResponseErrorUnauthorized
  extends IResponse<"IResponseErrorUnauthorized"> {
  readonly detail: string;
}
/**
 * Returns an unauthorized error response with status code 401.
 */
export function ResponseErrorUnauthorized(
  detail: string
): IResponseErrorUnauthorized {
  return {
    ...ResponseErrorGeneric(
      HttpStatusCodeEnum.HTTP_STATUS_401,
      "Unauthorized",
      detail
    ),
    ...{
      detail: `Unauthorized: ${detail}`,
      kind: "IResponseErrorUnauthorized"
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
    apply: (res) =>
      res
        .status(HttpStatusCodeEnum.HTTP_STATUS_500)
        .set("Content-Type", "application/problem+json")
        .json(problem),
    kind: "IResponseErrorInternal"
  };
};

/**
 * Returns a 404 error response payment api
 */
export const ResponsePaymentInfoNotFound = (
  status: HttpStatusCodeEnum,
  body: PaymentInfoNotFoundResponse
): IResponseErrorNotFound => ({
  apply: (res) =>
    res
      .status(status)
      .set("Content-Type", "application/problem+json")
      .json(body),
  kind: "IResponseErrorNotFound"
});

/**
 * Returns a 409 error response payment api
 */
export const ResponsePaymentInfoConflict = (
  status: HttpStatusCodeEnum,
  body: PaymentInfoConflictResponse
): IResponseErrorConflict => ({
  apply: (res) =>
    res
      .status(status)
      .set("Content-Type", "application/problem+json")
      .json(body),
  kind: "IResponseErrorConflict"
});

/**
 * Returns a 502 error response payment api
 */
export const ResponsePaymentInfoBadGateway = (
  status: HttpStatusCodeEnum,
  body: PaymentInfoBadGatewayResponse
): IResponseErrorBadGateway => ({
  apply: (res) =>
    res
      .status(status)
      .set("Content-Type", "application/problem+json")
      .json(body),
  kind: "IResponseErrorBadGateway"
});

/**
 * Returns a 503 error response payment api
 */
export const ResponsePaymentInfoUnavailable = (
  status: HttpStatusCodeEnum,
  body: PartyConfigurationFaultPaymentProblemJson
): IResponseErrorServiceUnavailable => ({
  apply: (res) =>
    res
      .status(status)
      .set("Content-Type", "application/problem+json")
      .json(body),
  kind: "IResponseErrorServiceUnavailable"
});

/**
 * Returns a 500 with json response.
 */
export const ResponsePaymentInfoInternal = (
  status: HttpStatusCodeEnum,
  detail?: string,
  title?: string,
  type?: string,
  instance?: string
): IResponsePaymentInternalError => {
  const problem: ProblemJson = {
    status: status as HttpStatusCode,
    title: title || "Internal server error",
    detail: detail || "Unexpected error from PagoPA Ecommerce API",
    type: type,
    instance
  };
  return {
    apply: (res) =>
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
export interface IResponseSuccessOctet<T>
  extends IResponse<"IResponseSuccessOctet"> {
  readonly value: T;
}

/**
 * Returns a successful octet stream response.
 *
 * @param o The object to return to the client
 */
export const ResponseSuccessOctet = (
  o: Buffer
): IResponseSuccessOctet<typeof o> => ({
  apply: (res) =>
    res
      .status(HttpStatusCodeEnum.HTTP_STATUS_200)
      .set("Content-Type", "application/octet-stream")
      .end(o),
  kind: "IResponseSuccessOctet",
  value: o
});

export const wrapValidationWithInternalError: <A>(
  fa: t.Validation<A>
) => TE.TaskEither<IResponseErrorInternal, A> = (fa) =>
  pipe(
    TE.fromEither(fa),
    TE.mapLeft(errorsToError),
    TE.mapLeft((e) => ResponseErrorInternal(e.message))
  );

/**
 * Interface for NotImplemented error response.
 */
export interface IResponseErrorNotImplemented
  extends IResponse<"IResponseErrorNotImplemented"> {
  readonly detail: string;
}
/**
 * Returns a Not Implemented error response with status code 501.
 */
export const ResponseErrorNotImplemented = (
  detail: string
): IResponseErrorNotImplemented => ({
  ...ResponseErrorGeneric(
    HttpStatusCodeEnum.HTTP_STATUS_501,
    "Not Implemented",
    detail
  ),
  ...{
    detail: `Not Implemented: ${detail}`,
    kind: "IResponseErrorNotImplemented"
  }
});

/**
 * Interface for `Unsupported Media Type` error response.
 */
export interface IResponseErrorUnsupportedMediaType
  extends IResponse<"IResponseErrorUnsupportedMediaType"> {
  readonly detail: string;
}
/**
 * Returns an `Unsupported Media Type` error response with status code 415.
 */
export const ResponseErrorUnsupportedMediaType = (
  detail: string
): IResponseErrorUnsupportedMediaType => ({
  ...ResponseErrorGeneric(
    HttpStatusCodeEnum.HTTP_STATUS_415,
    "Unsupported Media Type",
    detail
  ),
  ...{
    detail,
    kind: "IResponseErrorUnsupportedMediaType"
  }
});
