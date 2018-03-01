/**
 * This file adds a wrapper to the ServicePublic to allow runtime validation.
 */
import * as t from "io-ts";
import { string } from "io-ts";
import { NonNegativeNumber } from "../../utils/numbers";
import { strictInterfaceWithOptionals } from "../../utils/types";

// required attributes
const ServicePublicR = t.interface({
  departmentName: string,
  organizationName: string,
  serviceId: string,
  serviceName: string
});

// optional attributes
const ServicePublicO = t.partial({
  version: NonNegativeNumber
});

export const ServicePublic = strictInterfaceWithOptionals(
  ServicePublicR.props,
  ServicePublicO.props,
  "ServicePublic"
);

export type ServicePublic = t.TypeOf<typeof ServicePublic>;
