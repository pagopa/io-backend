/**
 * The (optional) subject of the message - note that only some notification
 * channels support the display of a subject. When a subject is not provided,
 * one gets generated from the client attributes.
 */

import { WithinRangeString } from "italia-ts-commons/lib/strings";

import * as t from "io-ts";

export type MessageSubject = t.TypeOf<typeof MessageSubject>;

export const MessageSubject = WithinRangeString(10, 120);
