import * as t from "io-ts";
import { readableReport } from "italia-ts-commons/lib/reporters";
import { IResponseType } from "italia-ts-commons/lib/requests";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

export function parseResponse<T>(
  res: t.Validation<
    // tslint:disable-next-line:max-union-size
    IResponseType<200, T> | IResponseType<400 | 401 | 404 | 500, unknown>
  >
): IResponseErrorInternal | IResponseErrorNotFound | IResponseSuccessJson<T> {
  if (res.isLeft()) {
    // response cannot be decoded
    return ResponseErrorInternal(readableReport(res.value));
  }
  if (res.value.status === 200) {
    return ResponseSuccessJson(res.value.value);
  }
  if (res.value.status === 404) {
    return ResponseErrorNotFound("Not found", "The entity was not found");
  }
  return unhandledResponseStatus(res.value.status);
}

/**
 * Transforms async failures into internal errors
 */
export const withCatchAsInternalError = <T>(
  f: () => Promise<T>,
  message: string = "Exception while calling upstream API (likely a timeout)."
): Promise<IResponseErrorInternal | T> =>
  f().catch(_ => ResponseErrorInternal(message));

export const unhandledResponseStatus = (status: number) =>
  ResponseErrorInternal(`unhandled API response status [${status}]`);
