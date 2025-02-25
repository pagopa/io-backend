import { ServicesStatus } from "../../../generated/public/ServicesStatus";
import { StatusEnumEnum } from "../../../generated/public/StatusEnum";

export const mockServicesStatus: ServicesStatus = {
  services: [
    {
      id: "io-backend",
      status: StatusEnumEnum.OK,
      details: "IO Backend service is running"
    }
  ]
};
