/**
 * This file adds a wrapper to the ServicePublic to allow runtime validation.
 */
import * as t from "io-ts";
import { string } from "io-ts";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { OrganizationFiscalCode } from "italia-ts-commons/lib/strings";
import { DepartmentName } from "../api/DepartmentName";
import { OrganizationName } from "../api/OrganizationName";
import { ServiceName } from "../api/ServiceName";

// required attributes
const ServicePublicR = t.interface({
  departmentName: DepartmentName,
  organizationFiscalCode: OrganizationFiscalCode,
  organizationName: OrganizationName,
  serviceId: string,
  serviceName: ServiceName
});

// optional attributes
const ServicePublicO = t.partial({
  version: NonNegativeInteger
});

export const ServicePublic = t.intersection([ServicePublicR, ServicePublicO]);

export type ServicePublic = t.TypeOf<typeof ServicePublic>;
