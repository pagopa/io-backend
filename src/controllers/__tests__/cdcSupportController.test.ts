import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { mockedUser } from "../../__mocks__/user_mock";
import CdcSupportController from "../cdcSupportController";
import { CdcSupportAPIClient } from "../../clients/cdc-support";
import CdcSupportService from "../../services/cdcSupportService";
import { CitizenStatus } from "../../../generated/cdc-support-platform/CitizenStatus";

const API_KEY = "";
const API_URL = "";
const API_BASE_PATH = "";

const mockStatus = jest.fn();

jest.mock("../../services/cdcSupportService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      status: mockStatus
    }))
  };
});

const mockedCitizenStatus = {
  number_of_cards: 1,
  expiration_date: new Date()
} as CitizenStatus;

const client = CdcSupportAPIClient(API_KEY, API_URL, API_BASE_PATH);
const cdcSupportService = new CdcSupportService(client);

describe("CdcSupportController#status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };
    const controller = new CdcSupportController(cdcSupportService);
    await controller.status(req);

    expect(mockStatus).toHaveBeenCalledWith(mockedUser.fiscal_code);
  });

  it("should call status method on the CdcSupportController with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };
    mockStatus.mockResolvedValueOnce(ResponseSuccessJson(mockedCitizenStatus));

    const controller = new CdcSupportController(cdcSupportService);
    const response = await controller.status(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: mockedCitizenStatus
    });
  });

  it("should not call status method on the CdcSupportController with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const controller = new CdcSupportController(cdcSupportService);
    const response = await controller.status(req);

    response.apply(res);

    // service method is not called
    expect(mockStatus).not.toHaveBeenCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 400 })
    );
  });
});
