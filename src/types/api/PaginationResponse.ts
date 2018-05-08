/* tslint:disable:ordered-imports */
/* tslint:disable:no-consecutive-blank-lines */
/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:max-line-length */
/* tslint:disable:jsdoc-format */
/* tslint:disable:interface-name */
/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

/**
 * Pagination response parameters.
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "italia-ts-commons/lib/types";

// required attributes
const PaginationResponseR = t.interface({});

// optional attributes
const PaginationResponseO = t.partial({
  page_size: t.number,

  next: t.string
});

export const PaginationResponse = strictInterfaceWithOptionals(
  PaginationResponseR.props,
  PaginationResponseO.props,
  "PaginationResponse"
);

export type PaginationResponse = t.TypeOf<typeof PaginationResponse>;
