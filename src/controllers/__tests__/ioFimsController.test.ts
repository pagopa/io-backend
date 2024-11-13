import {
  ResponseSuccessAccepted,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import mockReq from "../../__mocks__/request";
import IoFimsController from "../fimsController";
import { IoFimsAPIClient } from "../../clients/io-fims";

import ApiClient from "../../services/apiClientFactory";
import IoFimsService from "../../services/fimsService";
import ProfileService from "../../services/profileService";

import { ulid } from "ulid";

import {
  mockedUser,
  mockedInitializedProfile,
} from "../../__mocks__/user_mock";
const API_KEY = "";
const API_URL = "";
const API_BASE_PATH = "";

const mockGetAccessHistory = jest.fn();
const mockRequestExport = jest.fn();

jest.mock("../../services/fimsService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getAccessHistory: mockGetAccessHistory,
      requestExport: mockRequestExport,
    })),
  };
});

const mockGetProfile = jest.fn();

jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getProfile: mockGetProfile,
    })),
  };
});

const client = IoFimsAPIClient(API_KEY, API_URL, API_BASE_PATH);
const apiClient = new ApiClient("XUZTCT88A51Y311X", "");

const ioFimsService = new IoFimsService(client);
const profileService = new ProfileService(apiClient);

const mocks = {
  accessHistoryPage: {
    data: [],
  },
  exportRequest: {
    id: ulid(),
  },
  user: mockedUser,
  profile: mockedInitializedProfile,
};

describe("IoFimsController#getAccessHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    mockReq({ user: mocks.user }),
    mockReq({
      user: mocks.user,
      query: { page: "01JBYG9QM162C8KBP24EXP85NW" },
    }),
  ])("should make the correct service method call", async (request) => {
    mockGetAccessHistory.mockResolvedValueOnce(
      ResponseSuccessJson(mocks.accessHistoryPage)
    );

    const controller = new IoFimsController(ioFimsService, profileService);
    await controller.getAccessHistory(request);

    expect(mockGetAccessHistory).toHaveBeenCalledWith(
      request.user.fiscal_code,
      request.query.page
    );
  });

  it("should return an internal error if the service method fails", async () => {
    mockGetAccessHistory.mockRejectedValueOnce(new Error("Unexpected error"));

    const controller = new IoFimsController(ioFimsService, profileService);
    const response = await controller.getAccessHistory(
      mockReq({ user: mocks.user })
    );

    expect(response).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorInternal",
      })
    );
  });
});

describe("IoFimsController#requestExport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    mockRequestExport.mockResolvedValueOnce(
      ResponseSuccessAccepted("Export requested", mocks.exportRequest)
    );

    mockGetProfile.mockResolvedValueOnce(ResponseSuccessJson(mocks.profile));

    const controller = new IoFimsController(ioFimsService, profileService);
    await controller.requestExport(mockReq({ user: mocks.user }));

    expect(mockRequestExport).toHaveBeenCalledWith(
      mocks.profile.fiscal_code,
      mocks.profile.email
    );
  });

  it("should return an error if the profile is not found", async () => {
    mockGetProfile.mockResolvedValueOnce(ResponseSuccessJson(undefined));

    const controller = new IoFimsController(ioFimsService, profileService);
    const response = await controller.requestExport(
      mockReq({ user: mocks.user })
    );

    expect(response).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorInternal",
      })
    );
  });

  it("should return an internal error if the service method fails", async () => {
    mockRequestExport.mockRejectedValueOnce(new Error("Unexpected error"));

    const controller = new IoFimsController(ioFimsService, profileService);
    const response = await controller.requestExport(
      mockReq({ user: mocks.user })
    );

    expect(response).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorInternal",
      })
    );
  });
});
