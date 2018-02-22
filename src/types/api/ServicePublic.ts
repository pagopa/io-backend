// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

import { ServiceId } from "./ServiceId";
import { ServiceName } from "./ServiceName";
import { OrganizationName } from "./OrganizationName";
import { DepartmentName } from "./DepartmentName";

/**
 * A Service associated to an user's subscription.
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "../../utils/types";

// required attributes
const ServicePublicR = t.interface({
  service_id: ServiceId,

  service_name: ServiceName,

  organization_name: OrganizationName,

  department_name: DepartmentName
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
