/**
 * This file contains the Issuer model.
 */

import * as t from "io-ts";

export const Issuer = t.string;
export type Issuer = t.TypeOf<typeof Issuer>;
