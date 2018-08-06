/**
 * This file extend the base Error with a statusCode field.
 */
import { isRight } from "fp-ts/lib/Either";
import * as t from "io-ts";
import {
  HttpStatusCodeEnum,
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  ResponseErrorGeneric,
  ResponseErrorInternal,
  ResponseErrorNotFound
} from "italia-ts-commons/lib/responses";

export interface IErrorTag<T> {
  readonly message: string;
  readonly kind: T;
}

export type ServiceErrorInternal = IErrorTag<"ServiceErrorInternal">;

export type ServiceErrorNotFound = IErrorTag<"ServiceErrorNotFound">;

export type ServiceErrorGeneric = IErrorTag<"ServiceErrorGeneric">;

export type ServiceError =
  | ServiceErrorInternal
  | ServiceErrorNotFound
  | ServiceErrorGeneric;

export function internalError(message: string): ServiceErrorInternal {
  return { message, kind: "ServiceErrorInternal" } as ServiceErrorInternal;
}

export function notFoundError(message: string): ServiceErrorNotFound {
  return { message, kind: "ServiceErrorNotFound" } as ServiceErrorNotFound;
}

export function forbiddenError(message: string): ServiceErrorGeneric {
  return { message, kind: "ServiceErrorGeneric" } as ServiceErrorGeneric;
}

const ErrorGenericBody = t.interface({
  detail: t.string,
  status: t.number,
  title: t.string,
  type: t.string
});
type ErrorGenericBody = t.TypeOf<typeof ErrorGenericBody>;

export function toHttpError(
  err: ServiceError
): IResponseErrorNotFound | IResponseErrorInternal | IResponseErrorGeneric {
  switch (err.kind) {
    case "ServiceErrorInternal":
      return ResponseErrorInternal(err.message);
    case "ServiceErrorNotFound":
      return ResponseErrorNotFound("Not found", err.message);
    case "ServiceErrorGeneric":
      // Forbidden Error: Message into body should be propagated as is
      const errorGenericBodyOrError = ErrorGenericBody.decode(err.message);
      if (
        isRight(errorGenericBodyOrError) &&
        errorGenericBodyOrError.value.status === 403
      ) {
        const errorGenericBody = errorGenericBodyOrError.value;
        return ResponseErrorGeneric(
          HttpStatusCodeEnum.HTTP_STATUS_403,
          errorGenericBody.title,
          errorGenericBody.detail,
          errorGenericBody.type
        );
      }
      // Cannot decode the error
      return ResponseErrorInternal(err.message);
  }
}
