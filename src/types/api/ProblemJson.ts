/**
 *
 */

import * as t from "io-ts";
import { withDefault } from "italia-ts-commons/lib/types";
import { HttpStatusCode } from "./HttpStatusCode";

// required attributes
const ProblemJsonR = t.interface({});

// optional attributes
const ProblemJsonO = t.partial({
  detail: t.string,
  instance: t.string,
  status: HttpStatusCode,
  title: t.string,
  type: withDefault(t.string, "about:blank")
});

export const ProblemJson = t.intersection([ProblemJsonR, ProblemJsonO]);

export type ProblemJson = t.TypeOf<typeof ProblemJson>;
