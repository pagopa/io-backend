/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */

import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import {
  NonEmptyString,
  OrganizationFiscalCode
} from "@pagopa/ts-commons/lib/strings";

import { DepartmentName } from "../../../generated/backend/DepartmentName";
import { OrganizationName } from "../../../generated/backend/OrganizationName";
import { ServiceName } from "../../../generated/backend/ServiceName";
import { ServicePublic } from "../../../generated/backend/ServicePublic";
import { NotificationChannelEnum } from "../../../generated/io-api/NotificationChannel";
import mockReq from "../../__mocks__/request";
import ApiClient from "../../services/apiClientFactory";
import MessagesService from "../../services/messagesService";
import { mockedUser } from "../../__mocks__/user_mock";
import ServicesController from "../servicesController";

const aServiceId: string = "service-id";

const proxyService: ServicePublic = {
  available_notification_channels: [NotificationChannelEnum.EMAIL],
  department_name: "Department name" as DepartmentName,
  organization_fiscal_code: "12431435345" as OrganizationFiscalCode,
  organization_name: "Organization name" as OrganizationName,
  service_id: "5a563817fcc896087002ea46c49a" as NonEmptyString,
  service_name: "Service name" as ServiceName,
  version: 42 as NonNegativeInteger
};

const mockGetService = jest.fn();
jest.mock("../../services/messagesService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getService: mockGetService
    }))
  };
});

describe("serviceController#getService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getService on the serviceController with valid values", async () => {
    const req = mockReq();

    mockGetService.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyService))
    );

    req.user = mockedUser;
    req.params = { id: aServiceId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new ServicesController(messageService);

    const response = await controller.getService(req);

    expect(mockGetService).toHaveBeenCalledWith(aServiceId);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyService
    });
  });
});
