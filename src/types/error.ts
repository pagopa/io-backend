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
  readonly kind: T;
}

export type ServiceInternalError = string & IErrorTag<"ServiceInternalError">;

export type ServiceNotFoundError = string & IErrorTag<"ServiceNotFoundError">;

export type ServiceError = ServiceInternalError | ServiceNotFoundError;

export function internalError(message: string): ServiceInternalError {
  return message as ServiceInternalError;
}

export function notFoundError(message: string): ServiceNotFoundError {
  return message as ServiceNotFoundError;
}

export function toHttpError(
  err: ServiceError
): IResponseErrorNotFound | IResponseErrorInternal {
  switch (err.kind) {
    case "ServiceInternalError":
      return ResponseErrorInternal(err);
    case "ServiceNotFoundError":
      return ResponseErrorNotFound("Not found", err);
  }
}
