/**
 * This file contains the Issuer model.
 */

import * as t from "io-ts";
import { string } from "io-ts";

export const Issuer = t.interface({
  _: string
});

export type Issuer = t.TypeOf<typeof Issuer>;
