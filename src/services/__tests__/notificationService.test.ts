/* tslint:disable:no-null-keyword */

import { left, right } from "fp-ts/lib/Either";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { FiscalCode } from "../../types/api/FiscalCode";
import { MessageBodyMarkdown } from "../../types/api/MessageBodyMarkdown";
import { MessageSubject } from "../../types/api/MessageSubject";
import { DevicePlatformEnum, InstallationID } from "../../types/notification";
import NotificationService from "../notificationService";

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
const aFiscalCodeHash = "0/cCAv1NW9mV1v6ZYzfBt3sKSmMSAwSNr7oSHScV6lI=";
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
  tags: [aFiscalCodeHash], // This is the sha256 of "GRBGPP87L04L741X"
  templates: {
    template: {
      body: '{"aps": {"alert": {"title": "$(title)", "body": "$(message)"}}}'
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
  tags: [aFiscalCodeHash], // This is the sha256 of "GRBGPP87L04L741X"
  templates: {
    template: {
      body: '{"notification": {"title": "$(title)", "body": "$(message)"}}'
    }
  }
};
const aValidNotification = {
  message: {
    content: {
      markdown: "test".repeat(80) as MessageBodyMarkdown,
      subject: "this is a message" as MessageSubject
    },
    fiscalCode: aFiscalCode,
    senderServiceId: "234567"
  },
  senderMetadata: {
    departmentName: "test department" as NonEmptyString,
    organizationName: "test organization" as NonEmptyString,
    serviceName: "test service" as NonEmptyString
  }
};

const mockCreateOrUpdateInstallation = jest.fn();
const mockSend = jest.fn();
jest.mock("azure-sb", () => {
  return {
    createNotificationHubService: jest.fn().mockImplementation((_, __) => {
      return {
        createOrUpdateInstallation: mockCreateOrUpdateInstallation,
        send: mockSend
      };
    })
  };
});

const aGenericError = "An error occurred!";

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
      callback(new Error(aGenericError));
    });

    const service = new NotificationService("", "");

    const res = await service.createOrUpdateInstallation(
      aFiscalCode,
      anInstallationID,
      anAppleDevice
    );

    expect(res).toEqual(left(new Error(aGenericError)));
    expect(mockCreateOrUpdateInstallation).toBeCalledWith(
      anAppleInstallation,
      expect.any(Function)
    );
  });
});

describe("NotificationService#notify", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should submit a notification to the Notification Hub", async () => {
    mockSend.mockImplementation((_, __, callback) => {
      callback(null);
    });

    const service = new NotificationService("", "");

    const res = await service.notify(aFiscalCode, aValidNotification);

    expect(res).toEqual(
      right({
        body: "ok",
        status: 200
      })
    );
    expect(mockSend).toBeCalledWith(
      aFiscalCodeHash,
      {
        message: aValidNotification.message.content.markdown,
        title: aValidNotification.message.content.subject
      },
      expect.any(Function)
    );
  });

  it("should fail if the Notification Hub fails", async () => {
    mockSend.mockImplementation((_, __, callback) => {
      callback(new Error(aGenericError));
    });

    const service = new NotificationService("", "");

    const res = await service.notify(aFiscalCode, aValidNotification);

    expect(res).toEqual(left(new Error(aGenericError)));
    expect(mockSend).toBeCalledWith(
      aFiscalCodeHash,
      {
        message: aValidNotification.message.content.markdown,
        title: aValidNotification.message.content.subject
      },
      expect.any(Function)
    );
  });
});
