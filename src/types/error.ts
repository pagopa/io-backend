/**
 * This file extend the base Error with a statusCode field.
 */
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  ResponseErrorInternal,
  ResponseErrorNotFound
} from "italia-ts-commons/lib/responses";

export interface IErrorTag<T> {
  readonly message: string;
  readonly kind: T;
}

export type ServiceErrorInternal = IErrorTag<"ServiceErrorInternal">;

export type ServiceErrorNotFound = IErrorTag<"ServiceErrorNotFound">;

export type ServiceError = ServiceErrorInternal | ServiceErrorNotFound;

export function internalError(message: string): ServiceErrorInternal {
  return { message, kind: "ServiceErrorInternal" } as ServiceErrorInternal;
}

export function notFoundError(message: string): ServiceErrorNotFound {
  return { message, kind: "ServiceErrorNotFound" } as ServiceErrorNotFound;
}

export function toHttpError(
  err: ServiceError
): IResponseErrorNotFound | IResponseErrorInternal {
  switch (err.kind) {
    case "ServiceErrorInternal":
      return ResponseErrorInternal(err.message);
    case "ServiceErrorNotFound":
      return ResponseErrorNotFound("Not found", err.message);
  }
}
