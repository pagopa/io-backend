// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

/**
 * The ID of the Service. Equals the subscriptionId of a registered API user.
 */

import { NonEmptyString } from "../../utils/strings";

import * as t from "io-ts";

export type ServiceId = t.TypeOf<typeof ServiceId>;

export const ServiceId = NonEmptyString;
