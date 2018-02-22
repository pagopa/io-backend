// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

/**
 * The departmenet inside the organization that runs the service. Will be added to the content of sent messages.
 */

import { NonEmptyString } from "../../utils/strings";

import * as t from "io-ts";

export type DepartmentName = t.TypeOf<typeof DepartmentName>;

export const DepartmentName = NonEmptyString;
