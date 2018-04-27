/* tslint:disable:no-null-keyword */

import { left, right } from "fp-ts/lib/Either";
import { FiscalCode } from "../../types/api/FiscalCode";
import { DevicePlatformEnum, InstallationID } from "../../types/notification";
import NotificationService from "../notificationService";

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
const anInstallationID = "550e8400-e29b-41d4-a716-446655440000" as InstallationID;
const aPushChannel =
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000";
const anAppleDevice = {
  platform: DevicePlatformEnum.apns,
  pushChannel: aPushChannel
};
const anAppleInstallation = {
  installationId: anInstallationID,
  platform: DevicePlatformEnum.apns,
  pushChannel: aPushChannel,
  tags: ["0/cCAv1NW9mV1v6ZYzfBt3sKSmMSAwSNr7oSHScV6lI="], // This is the sha256 of "GRBGPP87L04L741X"
  templates: {
    template: {
      body: '{"aps": {"alert": "$(message)"}}'
    }
  }
};
const aGoogleDevice = {
  platform: DevicePlatformEnum.gcm,
  pushChannel: aPushChannel
};
const aGoogleInstallation = {
  installationId: anInstallationID,
  platform: DevicePlatformEnum.gcm,
  pushChannel: aPushChannel,
  tags: ["0/cCAv1NW9mV1v6ZYzfBt3sKSmMSAwSNr7oSHScV6lI="], // This is the sha256 of "GRBGPP87L04L741X"
  templates: {
    template: {
      body: '{"data": {"message": "$(message)"}}'
    }
  }
};

const mockCreateOrUpdateInstallation = jest.fn();
jest.mock("azure-sb", () => {
  return {
    createNotificationHubService: jest.fn().mockImplementation((_, __) => {
      return {
        createOrUpdateInstallation: mockCreateOrUpdateInstallation
      };
    })
  };
});

describe("NotificationService#createOrUpdateInstallation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should submit a correct installation to the Notification Hub, Apple platform", async () => {
    mockCreateOrUpdateInstallation.mockImplementation((_, callback) => {
      callback(null);
    });

    const service = new NotificationService("", "");

    const res = await service.createOrUpdateInstallation(
      aFiscalCode,
      anInstallationID,
      anAppleDevice
    );

    expect(res).toEqual(
      right({
        body: "ok",
        status: 200
      })
    );
    expect(mockCreateOrUpdateInstallation).toBeCalledWith(
      anAppleInstallation,
      expect.any(Function)
    );
  });

  it("should submit a correct installation to the Notification Hub, Google platform", async () => {
    mockCreateOrUpdateInstallation.mockImplementation((_, callback) => {
      callback(null);
    });

    const service = new NotificationService("", "");

    const res = await service.createOrUpdateInstallation(
      aFiscalCode,
      anInstallationID,
      aGoogleDevice
    );

    expect(res).toEqual(
      right({
        body: "ok",
        status: 200
      })
    );
    expect(mockCreateOrUpdateInstallation).toBeCalledWith(
      aGoogleInstallation,
      expect.any(Function)
    );
  });

  it("should fail if the Notification Hub fails", async () => {
    mockCreateOrUpdateInstallation.mockImplementation((_, callback) => {
      callback(new Error("An error occurred!"));
    });

    const service = new NotificationService("", "");

    const res = await service.createOrUpdateInstallation(
      aFiscalCode,
      anInstallationID,
      anAppleDevice
    );

    expect(res).toEqual(left(new Error("An error occurred!")));
    expect(mockCreateOrUpdateInstallation).toBeCalledWith(
      anAppleInstallation,
      expect.any(Function)
    );
  });
});
