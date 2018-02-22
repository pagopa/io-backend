// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

import { HttpStatusCode } from "./HttpStatusCode";

import { withDefault } from "../../utils/default";

/**
 *
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "../../utils/types";

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
