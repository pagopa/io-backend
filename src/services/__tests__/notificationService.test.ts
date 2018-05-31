/* tslint:disable:no-null-keyword */

import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { InstallationID } from "../../types/api/InstallationID";
import { MessageBodyMarkdown } from "../../types/api/MessageBodyMarkdown";
import { MessageSubject } from "../../types/api/MessageSubject";
import { PlatformEnum } from "../../types/api/Platform";
import { TaxCode } from "../../types/api/TaxCode";
import NotificationService from "../notificationService";

const aTaxCode = "GRBGPP87L04L741X" as TaxCode;
const aTaxCodeHash =
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
  tags: [aTaxCodeHash], // This is the sha256 of "GRBGPP87L04L741X"
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
  tags: [aTaxCodeHash], // This is the sha256 of "GRBGPP87L04L741X"
  templates: {
    template: {
      body:
        '{"notification": {"title": "$(title)", "body": "$(message)"}, "data": {"message_id": "$(message_id)"}}'
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
    id: "01CCKCY7QQ7WCHWTH8NB504386",
    sender_service_id: "234567",
    tax_code: aTaxCode
  },
  senderMetadata: {
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
      aTaxCode,
      anInstallationID,
      anAppleDevice
    );

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: "ok"
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
      aTaxCode,
      anInstallationID,
      aGoogleDevice
    );

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: "ok"
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
      aTaxCode,
      anInstallationID,
      anAppleDevice
    );

    expect(res).toEqual({
      apply: expect.any(Function),
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
    mockSend.mockImplementation((_, __, callback) => {
      callback(null);
    });

    const service = new NotificationService("", "");

    const res = await service.notify(aValidNotification);

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: "ok"
    });
    expect(mockSend).toBeCalledWith(
      aTaxCodeHash,
      {
        message: aValidNotification.message.content.markdown,
        message_id: aValidNotification.message.id,
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

    const res = await service.notify(aValidNotification);

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorInternal"
    });
    expect(mockSend).toBeCalledWith(
      aTaxCodeHash,
      {
        message: aValidNotification.message.content.markdown,
        message_id: aValidNotification.message.id,
        title: aValidNotification.message.content.subject
      },
      expect.any(Function)
    );
  });
});
