import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { DepartmentName } from "../api/DepartmentName";
import { OrganizationName } from "../api/OrganizationName";
import { ServiceName } from "../api/ServiceName";
import { ServicePublic } from "../api_client/servicePublic";
import { toAppService } from "../service";

const aNonNegativeInteger = 1 as NonNegativeInteger;

// mock for a valid ServicePublic
const mockedServicePublic: ServicePublic = {
  departmentName: "department-name" as DepartmentName,
  organizationName: "organization-name" as OrganizationName,
  serviceId: "service-id",
  serviceName: "service-name" as ServiceName,
  version: aNonNegativeInteger
};

describe("service type", () => {
  // test case: service is initialized with correct values
  it("should get a service", async () => {
    // converts ServicePublic to AppService
    const appService = toAppService(mockedServicePublic);

    expect(appService.service_id).toBe(mockedServicePublic.serviceId);
    expect(appService.service_name).toBe(mockedServicePublic.serviceName);
    expect(appService.organization_name).toBe(
      mockedServicePublic.organizationName
    );
    expect(appService.department_name).toBe(mockedServicePublic.departmentName);
    expect(appService.version).toBe(aNonNegativeInteger);
  });
});
