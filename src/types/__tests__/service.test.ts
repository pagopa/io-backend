import { NonNegativeNumber } from "../../utils/numbers";
import { Service, toAppService } from "../service";

const aNonNegativeNumber = 1 as NonNegativeNumber;

// mock for a valid ServicePublic
const mockedServicePublic: Service = {
  departmentName: "department-name",
  organizationName: "organization-name",
  serviceId: "service-id",
  serviceName: "service-name",
  version: aNonNegativeNumber
};

describe("service type", () => {
  // test case: service is initialized with correct values
  it("should get a service", async () => {
    // converts ServicePublic to AppService
    const appService = toAppService(mockedServicePublic);

    expect(appService.serviceId).toBe(mockedServicePublic.serviceId);
    expect(appService.serviceName).toBe(mockedServicePublic.serviceName);
    expect(appService.organizationName).toBe(
      mockedServicePublic.organizationName
    );
    expect(appService.departmentName).toBe(mockedServicePublic.departmentName);
    expect(appService.version).toBe(aNonNegativeNumber);
  });
});
