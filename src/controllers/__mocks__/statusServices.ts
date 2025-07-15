import { ServicesStatus } from "../../../generated/platform/ServicesStatus";
import { StatusEnumEnum } from "../../../generated/platform/StatusEnum";

export const mockServicesStatus: ServicesStatus = {
  services: [
    {
      id: "io-backend",
      status: StatusEnumEnum.OK,
      details: "IO Backend service is running"
    }
  ]
};
