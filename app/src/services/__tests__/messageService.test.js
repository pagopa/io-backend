"use strict";

import mockRes from "../../__mocks__/response";
import MessageService from "../messageService";

const validApiMessagesResponse = {
  pageSize: 3,
  items: [
    {
      id: "01C3GCQWHBBZ6T448D8MCN11D3",
      fiscalCode: "XUZTCT88A51Y311X",
      senderServiceId: "AzureDeployc49a"
    },
    {
      id: "01C3GDA0GB7GAFX6CCZ3FK3Z5Q",
      fiscalCode: "XUZTCT88A51Y311X",
      senderServiceId: "5a563817fcc896087002ea46c49a"
    },
    {
      id: "01C3XE80E6X8PHY0NM8S8SDS1E",
      fiscalCode: "XUZTCT88A51Y311X",
      senderServiceId: "5a563817fcc896087002ea46c49a"
    }
  ]
};
const proxyMessagesResponse = {
  items: [
    { id: "01C3GCQWHBBZ6T448D8MCN11D3", sender_service_id: "AzureDeployc49a" },
    {
      id: "01C3GDA0GB7GAFX6CCZ3FK3Z5Q",
      sender_service_id: "5a563817fcc896087002ea46c49a"
    },
    {
      id: "01C3XE80E6X8PHY0NM8S8SDS1E",
      sender_service_id: "5a563817fcc896087002ea46c49a"
    }
  ],
  pageSize: 3
};

describe("Messages Service getUserMessagesResponse method", () => {
  it("returns a list of messages from the API", () => {
    const res = mockRes();

    const service = new MessageService(null);

    service.manageUserMessagesResponse(validApiMessagesResponse, res);

    expect(res.json).toHaveBeenCalledWith(proxyMessagesResponse);
  });
});
