/**
 * Common response message type.
 */

import * as t from "io-ts";

export const SuccessResponse = t.interface({
  message: t.string
});

export type SuccessResponse = t.TypeOf<typeof SuccessResponse>;
