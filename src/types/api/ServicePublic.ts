/* tslint:disable:ordered-imports */
/* tslint:disable:no-consecutive-blank-lines */
/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:max-line-length */
/* tslint:disable:jsdoc-format */
/* tslint:disable:interface-name */
/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

/**
 * A Service associated to an user's subscription.
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "italia-ts-commons/lib/types";

// required attributes
const ServicePublicR = t.interface({
  service_id: t.string,

  service_name: t.string,

  organization_name: t.string,

  department_name: t.string
});

// optional attributes
const ServicePublicO = t.partial({
  version: t.number
});

export const ServicePublic = strictInterfaceWithOptionals(
  ServicePublicR.props,
  ServicePublicO.props,
  "ServicePublic"
);

export type ServicePublic = t.TypeOf<typeof ServicePublic>;
