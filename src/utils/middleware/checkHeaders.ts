/**
 * An express middleware that checks if headers contain some expected values
 */

/* eslint-disable sonarjs/no-duplicate-string */

import { Request, Response, NextFunction } from "express";
import { fromNullable, Option } from "fp-ts/lib/Option";
import { fromPredicate, fromOption, Either } from "fp-ts/lib/Either";
import { intersection } from "fp-ts/lib/Array";
import { setoidString } from "fp-ts/lib/Setoid";
import { log } from "../logger";

type ValidateErrors =
  | "no-header"
  | "unexpected-header-values"
  | "no-expected-headers-provided";

const acceptHeader = (req: Request): Option<string> =>
  fromNullable(req.headers.accept);

const contentTypeHeader = (req: Request): Option<string> =>
  fromNullable(req.headers["content-type"]);

export const validate = (expectedHeaderValues: ReadonlyArray<string>) => (
  maybeHeader: Option<string>
): Either<ValidateErrors, ReadonlyArray<string>> =>
  // check if expected headers is not empty
  fromPredicate<ValidateErrors, void>(
    () => expectedHeaderValues.length > 0,
    () => "no-expected-headers-provided"
  )().chain<ReadonlyArray<string>>(() =>
    fromOption<ValidateErrors>("no-header")(maybeHeader)
      // split header on , for values and on ; for q-factors
      .map(header => header.split(/[,;]/).map(s => s.trim()))
      // get the common values between header values and expected values
      .map(headerValues =>
        intersection(setoidString)(
          headerValues,
          // eslint-disable-next-line functional/prefer-readonly-type
          expectedHeaderValues as string[]
        )
      )
      .chain(
        fromPredicate(
          commonValues => commonValues.length > 0,
          () => "unexpected-header-values"
        )
      )
  );

/**
 * This function logs if the request `accept` header is present
 * and contains at least one of the given expected values.
 *
 * @param expectedHeaderValues an array of expected values
 * @returns
 */
export const checkAcceptHeader = (
  expectedHeaderValues: ReadonlyArray<string>
): ((req: Request, res: Response, next: NextFunction) => void) => (
  req: Request,
  _: Response,
  next: NextFunction
): void => {
  validate(expectedHeaderValues)(acceptHeader(req))
    .mapLeft(err => {
      switch (err) {
        case "no-header":
          return "No accept header found";
        case "unexpected-header-values":
          return "Accept header does not contain any of expected values";
        case "no-expected-headers-provided":
          return "Cannot check headers if you do not provide expected values";
        default:
          return "Unexpected case";
      }
    })
    .mapLeft(log.warn);

  next();
};

/**
 * This function logs if the request `content-type` header is present
 * and contains at least one of the given expected values.
 *
 * @param expectedHeaderValues an array of expected values
 * @returns
 */
export const checkContentTypeHeader = (
  expectedHeaderValues: ReadonlyArray<string>
): ((req: Request, res: Response, next: NextFunction) => void) => (
  req: Request,
  _: Response,
  next: NextFunction
): void => {
  validate(expectedHeaderValues)(contentTypeHeader(req))
    .mapLeft(err => {
      switch (err) {
        case "no-header":
          return "No content-type header found";
        case "unexpected-header-values":
          return "Content-type header does not contain any of expected values";
        case "no-expected-headers-provided":
          return "Cannot check headers if you do not provide expected values";
        default:
          return "Unexpected case";
      }
    })
    .mapLeft(log.warn);

  next();
};
