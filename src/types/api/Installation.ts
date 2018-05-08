/* tslint:disable:ordered-imports */
/* tslint:disable:no-consecutive-blank-lines */
/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:max-line-length */
/* tslint:disable:jsdoc-format */
/* tslint:disable:interface-name */
/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

/**
 * Describes an app installation.
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "italia-ts-commons/lib/types";

// required attributes
const InstallationR = t.interface({
  platform: t.string,

  pushChannel: t.string
});

// optional attributes
const InstallationO = t.partial({});

export const Installation = strictInterfaceWithOptionals(
  InstallationR.props,
  InstallationO.props,
  "Installation"
);

export type Installation = t.TypeOf<typeof Installation>;
