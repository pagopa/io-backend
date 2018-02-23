/**
 *
 */

import * as t from "io-ts";
import { number, string } from "io-ts";
import { strictInterfaceWithOptionals } from "../../utils/types";

// required attributes
const ServicePublicR = t.interface({});

// optional attributes
const ServicePublicO = t.partial({
  departmentName: string,
  organizationName: string,
  serviceId: string,
  serviceName: string,
  version: number
});

export const ServicePublic = strictInterfaceWithOptionals(
  ServicePublicR.props,
  ServicePublicO.props,
  "ServicePublic"
);

export type ServicePublic = t.TypeOf<typeof ServicePublic>;
