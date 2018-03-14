import * as t from "io-ts";

import { HttpStatusCode } from "./HttpStatusCode";
import { strictInterfaceWithOptionals } from "../../utils/types";
import { withDefault } from "../../utils/default";

/**
 *
 */

// required attributes
const ProblemJsonR = t.interface({});

// optional attributes
const ProblemJsonO = t.partial({
  type: withDefault(t.string, "about:blank"),

  title: t.string,

  status: HttpStatusCode,

  detail: t.string,

  instance: t.string
});

export const ProblemJson = strictInterfaceWithOptionals(
  ProblemJsonR.props,
  ProblemJsonO.props,
  "ProblemJson"
);

export type ProblemJson = t.TypeOf<typeof ProblemJson>;
