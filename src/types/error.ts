/**
 * This file extend the base Error with a statusCode field.
 */
import {
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

export type ServiceErrorBadRequest = IErrorTag<"ServiceErrorBadRequest">;

export type ServiceRequestThrottledError = IErrorTag<
  "ServiceRequestThrottledError"
>;

export type ServiceConflictError = IErrorTag<"ServiceConflictError">;

export type ServiceError =
  | ServiceErrorInternal
  | ServiceErrorNotFound
  | ServiceErrorBadRequest
  | ServiceRequestThrottledError
  | ServiceConflictError;

export function internalError(message: string): ServiceErrorInternal {
  return { message, kind: "ServiceErrorInternal" } as ServiceErrorInternal;
}

export function notFoundError(message: string): ServiceErrorNotFound {
  return { message, kind: "ServiceErrorNotFound" } as ServiceErrorNotFound;
}

export function badRequestError(message: string): ServiceErrorBadRequest {
  return { message, kind: "ServiceErrorBadRequest" } as ServiceErrorBadRequest;
}

export function requestThrottledError(
  message: string
): ServiceRequestThrottledError {
  return {
    kind: "ServiceRequestThrottledError",
    message
  } as ServiceRequestThrottledError;
}

export function conflictError(message: string): ServiceConflictError {
  return { message, kind: "ServiceConflictError" } as ServiceConflictError;
}

export function toHttpError(
  err: ServiceError
): IResponseErrorNotFound | IResponseErrorInternal | IResponseErrorGeneric {
  switch (err.kind) {
    case "ServiceErrorInternal":
      return ResponseErrorInternal(err.message);
    case "ServiceErrorNotFound":
      return ResponseErrorNotFound("Not found", err.message);
    case "ServiceErrorBadRequest":
      return ResponseErrorGeneric(400, "Bad Request", err.message);
    case "ServiceConflictError":
      return ResponseErrorGeneric(409, "Conflict", err.message);
    case "ServiceRequestThrottledError":
      return ResponseErrorGeneric(429, "Request Throttled", err.message);
  }
}
