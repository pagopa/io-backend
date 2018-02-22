// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

/**
 * The HTTP status code generated by the origin server for this occurrence
 of the problem.

 */

import { WithinRangeNumber } from "../../utils/numbers";

import * as t from "io-ts";

export type HttpStatusCode = t.TypeOf<typeof HttpStatusCode>;

export const HttpStatusCode = WithinRangeNumber(100, 600);
