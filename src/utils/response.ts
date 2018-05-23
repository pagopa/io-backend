/**
 * This file contains functions and constants useful for generating HTTP responses.
 */

import * as express from "express";
import * as t from "io-ts";
import { WithinRangeNumber } from "italia-ts-commons/lib/numbers";
import { ProblemJson } from "../types/api/ProblemJson";

export type HttpStatusCode = t.TypeOf<typeof HttpStatusCode>;

export const HttpStatusCode = WithinRangeNumber(100, 600);

const HTTP_STATUS_200 = 200 as HttpStatusCode;
const HTTP_STATUS_400 = 400 as HttpStatusCode;
const HTTP_STATUS_404 = 404 as HttpStatusCode;
const HTTP_STATUS_500 = 500 as HttpStatusCode;

export interface IResponse<T> {
  // readonly body: T;
  // readonly status: number;
  readonly apply: (response: express.Response) => void;
  readonly kind: T;
}

/**
 * Interface for a response describing a generic server error.
 */
interface IResponseErrorGeneric extends IResponse<"IResponseErrorGeneric"> {}

/**
 * Returns a response describing a generic error.
 *
 * The error is translated to an RFC 7807 response (Problem JSON)
 * See https://zalando.github.io/restful-api-guidelines/index.html#176
 *
 */
function ResponseErrorGeneric(
  status: HttpStatusCode,
  title: string,
  detail: string,
  problemType?: string
): IResponseErrorGeneric {
  const problem: ProblemJson = {
    detail,
    status,
    title,
    type: problemType
  };
  return {
    apply: res =>
      res
        .status(status)
        .set("Content-Type", "application/problem+json")
        .json(problem),
    kind: "IResponseErrorGeneric"
  };
}

/**
 * Interface for a successful response returning a json object.
 */
export interface IResponseSuccessJson<T>
  extends IResponse<"IResponseSuccessJson"> {
  readonly value: T; // needed to discriminate from other T subtypes
}

/**
 * Returns a successful json response.
 *
 * @param o The object to return to the client
 */
export function ResponseSuccessJson<T>(o: T): IResponseSuccessJson<T> {
  return {
    apply: res => res.status(HTTP_STATUS_200).json(o),
    kind: "IResponseSuccessJson",
    value: o
  };
}

/**
 * Interface for a successful response returning a xml object.
 */
export interface IResponseSuccessXml<T>
  extends IResponse<"IResponseSuccessXml"> {
  readonly value: T; // needed to discriminate from other T subtypes
}

/**
 * Returns a successful xml response.
 *
 * @param o The object to return to the client
 */
export function ResponseSuccessXml<T>(o: T): IResponseSuccessXml<T> {
  return {
    apply: res =>
      res
        .status(HTTP_STATUS_200)
        .set("Content-Type", "application/xml")
        .send(o),
    kind: "IResponseSuccessXml",
    value: o
  };
}

/**
 * Interface for a issuing a client redirect .
 */
export interface IResponseRedirect extends IResponse<"IResponseRedirect"> {}

/**
 * Returns a redirect response.
 *
 * @param o The object to return to the client
 */
export function ResponseRedirect(o: string): IResponseRedirect {
  return {
    apply: res => res.redirect(o),
    kind: "IResponseRedirect"
  };
}

/**
 * Interface for a response describing a 404 error.
 */
export interface IResponseErrorNotFound
  extends IResponse<"IResponseErrorNotFound"> {}

/**
 * Returns a response describing a 404 error.
 */
export function ResponseErrorNotFound(
  title: string,
  detail: string
): IResponseErrorNotFound {
  return {
    ...ResponseErrorGeneric(HTTP_STATUS_404, title, detail),
    kind: "IResponseErrorNotFound"
  };
}

/**
 * Interface for a response describing a validation error.
 */
export interface IResponseErrorValidation
  extends IResponse<"IResponseErrorValidation"> {}

/**
 * Returns a response describing a validation error.
 */
export function ResponseErrorValidation(
  title: string,
  detail: string
): IResponseErrorValidation {
  return {
    ...ResponseErrorGeneric(HTTP_STATUS_400, title, detail),
    kind: "IResponseErrorValidation"
  };
}

/**
 * Interface for a response describing a fatal error.
 */
export interface IResponseErrorFatal extends IResponse<"IResponseErrorFatal"> {}

/**
 * Returns a response describing a fatal error.
 */
export function ResponseErrorFatal(
  title: string,
  detail: string
): IResponseErrorFatal {
  return {
    ...ResponseErrorGeneric(HTTP_STATUS_500, title, detail),
    kind: "IResponseErrorFatal"
  };
}
