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
