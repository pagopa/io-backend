/* tslint:disable:no-null-keyword */

import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { InstallationID } from "../../../generated/backend/InstallationID";
import { MessageBodyMarkdown } from "../../../generated/backend/MessageBodyMarkdown";
import { MessageSubject } from "../../../generated/backend/MessageSubject";
import { PlatformEnum } from "../../../generated/backend/Platform";
import { APNSPushType } from "../../types/notification";
import NotificationService from "../notificationService";

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
const aFiscalCodeHash =
  "d3f70202fd4d5bd995d6fe996337c1b77b0a4a631203048dafba121d2715ea52";
const anInstallationID = "550e8400-e29b-41d4-a716-446655440000" as InstallationID;
const aPushChannel =
  "fLKP3EATnBI:APA91bEy4go681jeSEpLkNqhtIrdPnEKu6Dfi-STtUiEnQn8RwMfBiPGYaqdWrmzJyXIh5Yms4017MYRS9O1LGPZwA4sOLCNIoKl4Fwg7cSeOkliAAtlQ0rVg71Kr5QmQiLlDJyxcq3p";
const anAppleDevice = {
  platform: PlatformEnum.apns,
  pushChannel: aPushChannel
};
const anAppleInstallation = {
  installationId: anInstallationID,
  platform: PlatformEnum.apns,
  pushChannel: aPushChannel,
  tags: [aFiscalCodeHash], // This is the sha256 of "GRBGPP87L04L741X"
  templates: {
    template: {
      body:
        '{"aps": {"alert": {"title": "$(title)", "body": "$(message)"}}, "message_id": "$(message_id)"}'
    }
  }
};
const aGoogleDevice = {
  platform: PlatformEnum.gcm,
  pushChannel: aPushChannel
};
const aGoogleInstallation = {
  installationId: anInstallationID,
  platform: PlatformEnum.gcm,
  pushChannel: aPushChannel,
  tags: [aFiscalCodeHash], // This is the sha256 of "GRBGPP87L04L741X"
  templates: {
    template: {
      body:
        '{"data": {"title": "$(title)", "message": "$(message)", "message_id": "$(message_id)", "smallIcon": "ic_notification", "largeIcon": "ic_notification"}}'
    }
  }
};
const aValidNotification = {
  message: {
    content: {
      markdown: "test".repeat(80) as MessageBodyMarkdown,
      subject: "this is a message" as MessageSubject
    },
    created_at: new Date(),
    fiscal_code: aFiscalCode,
    id: "01CCKCY7QQ7WCHWTH8NB504386",
    sender_service_id: "234567"
  },
  sender_metadata: {
    department_name: "test department" as NonEmptyString,
    organization_name: "test organization" as NonEmptyString,
    service_name: "test service" as NonEmptyString
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

const expectedSendOptions = {
  headers: {
    ["apns-push-type"]: APNSPushType.ALERT,
    ["apns-priority"]: 10
  }
};

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

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
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

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
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

    expect(res).toEqual({
      apply: expect.any(Function),
      detail: expect.anything(),
      kind: "IResponseErrorInternal"
    });
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
    mockSend.mockImplementation((_, __, ___, callback) => {
      callback(null);
    });

    const service = new NotificationService("", "");

    const res = await service.notify(aValidNotification);

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
    expect(mockSend).toBeCalledWith(
      aFiscalCodeHash,
      {
        message: aValidNotification.message.content.subject,
        message_id: aValidNotification.message.id,
        title: `${aValidNotification.sender_metadata.service_name} - ${aValidNotification.sender_metadata.organization_name}`
      },
      expectedSendOptions,
      expect.any(Function)
    );
  });

  it("should fail if the Notification Hub fails", async () => {
    mockSend.mockImplementation((_, __, ___, callback) => {
      callback(new Error(aGenericError));
    });

    const service = new NotificationService("", "");

    const res = await service.notify(aValidNotification);

    expect(res).toEqual({
      apply: expect.any(Function),
      detail: expect.anything(),
      kind: "IResponseErrorInternal"
    });
    expect(mockSend).toBeCalledWith(
      aFiscalCodeHash,
      {
        message: aValidNotification.message.content.subject,
        message_id: aValidNotification.message.id,
        title: `${aValidNotification.sender_metadata.service_name} - ${aValidNotification.sender_metadata.organization_name}`
      },
      expectedSendOptions,
      expect.any(Function)
    );
  });
});
