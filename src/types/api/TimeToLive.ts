/**
 * This parameter specifies for how long (in seconds) the system will try to deliver the message to the channels configured by the user.
 */

import { WithinRangeNumber } from "italia-ts-commons/lib/numbers";

import * as t from "io-ts";

import { withDefault } from "italia-ts-commons/lib/types";

export type TimeToLive = t.TypeOf<typeof TimeToLiveBase>;

const TimeToLiveBase = WithinRangeNumber(3600, 31536000);

export const TimeToLive = withDefault(TimeToLiveBase, 3600 as TimeToLive);
