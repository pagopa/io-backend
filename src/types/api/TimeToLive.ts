// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

/**
 * This parameter specifies for how long (in seconds) the system will try to deliver the message to the channels configured by the user.
 */

import { WithinRangeNumber } from "../../utils/numbers";

import * as t from "io-ts";

import { withDefault } from "../../utils/default";

export type TimeToLive = t.TypeOf<typeof TimeToLiveBase>;

const TimeToLiveBase = WithinRangeNumber(3600, 31536000);

export const TimeToLive = withDefault(TimeToLiveBase, 3600 as TimeToLive);
