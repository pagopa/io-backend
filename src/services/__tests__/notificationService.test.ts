/* tslint:disable:no-null-keyword */

import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { MessageBodyMarkdown } from "../../../generated/backend/MessageBodyMarkdown";
import { MessageSubject } from "../../../generated/backend/MessageSubject";
import { PlatformEnum } from "../../../generated/backend/Platform";
import {
  CreateOrUpdateInstallationMessage,
  KindEnum as CreateOrUpdateKind
} from "../../../generated/messages/CreateOrUpdateInstallationMessage";
import {
  DeleteInstallationMessage,
  KindEnum as DeleteKind
} from "../../../generated/messages/DeleteInstallationMessage";
import { NotifyMessage } from "../../../generated/messages/NotifyMessage";
import { toFiscalCodeHash } from "../../types/notification";
import { base64EncodeObject } from "../../utils/messages";
import NotificationService from "../notificationService";

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
const aFiscalCodeHash =
  "d3f70202fd4d5bd995d6fe996337c1b77b0a4a631203048dafba121d2715ea52";
const aPushChannel =
  "fLKP3EATnBI:APA91bEy4go681jeSEpLkNqhtIrdPnEKu6Dfi-STtUiEnQn8RwMfBiPGYaqdWrmzJyXIh5Yms4017MYRS9O1LGPZwA4sOLCNIoKl4Fwg7cSeOkliAAtlQ0rVg71Kr5QmQiLlDJyxcq3p";
const anAppleDevice = {
  platform: PlatformEnum.apns,
  pushChannel: aPushChannel
};
const anAppleInstallation: CreateOrUpdateInstallationMessage = {
  installationId: toFiscalCodeHash(aFiscalCode),
  kind: CreateOrUpdateKind.CreateOrUpdateInstallation,
  platform: PlatformEnum.apns,
  pushChannel: aPushChannel,
  tags: [aFiscalCodeHash] // This is the sha256 of "GRBGPP87L04L741X"
};
const aGoogleDevice = {
  platform: PlatformEnum.gcm,
  pushChannel: aPushChannel
};
const aGoogleInstallation: CreateOrUpdateInstallationMessage = {
  installationId: toFiscalCodeHash(aFiscalCode),
  kind: CreateOrUpdateKind.CreateOrUpdateInstallation,
  platform: PlatformEnum.gcm,
  pushChannel: aPushChannel,
  tags: [aFiscalCodeHash] // This is the sha256 of "GRBGPP87L04L741X"
};

const aNotificationSubject = "this is a message" as MessageSubject;

const aValidNotification = {
  message: {
    content: {
      markdown: "test".repeat(80) as MessageBodyMarkdown,
      subject: aNotificationSubject
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
const mockSendMessage = jest.fn();
jest.mock("@azure/storage-queue", () => ({
  QueueClient: jest.fn().mockImplementation((_, __) => {
    return {
      sendMessage: mockSendMessage
    };
  })
}));

const genericError = new Error("Generic Error");

describe("NotificationService#createOrUpdateInstallation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should submit a correct installation to the Queue Storage, Apple platform", async () => {
    mockSendMessage.mockImplementation(_ => Promise.resolve());

    const service = new NotificationService("", "");

    const res = await service.createOrUpdateInstallation(
      aFiscalCode,
      anAppleDevice
    );

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
    expect(mockSendMessage).toBeCalledWith(
      base64EncodeObject(anAppleInstallation)
    );
  });

  it("should submit a correct installation to the Queue Storage, Google platform", async () => {
    mockSendMessage.mockImplementation(_ => Promise.resolve());

    const service = new NotificationService("", "");

    const res = await service.createOrUpdateInstallation(
      aFiscalCode,
      aGoogleDevice
    );

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
    expect(mockSendMessage).toBeCalledWith(
      base64EncodeObject(aGoogleInstallation)
    );
  });

  it("should fail if the Queue Storage fails on createOrUpdateInstallation", async () => {
    mockSendMessage.mockImplementation(_ => Promise.reject(genericError));

    const service = new NotificationService("", "");

    const res = await service.createOrUpdateInstallation(
      aFiscalCode,
      anAppleDevice
    );

    expect(res).toEqual({
      apply: expect.any(Function),
      detail: expect.anything(),
      kind: "IResponseErrorInternal"
    });
    expect(mockSendMessage).toBeCalledWith(
      base64EncodeObject(anAppleInstallation)
    );
  });
});

describe("NotificationService#notify", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should submit a notification to the Queue Storage", async () => {
    mockSendMessage.mockImplementation(_ => Promise.resolve());
    const service = new NotificationService("", "");

    const res = await service.notify(aValidNotification, aNotificationSubject);

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
    expect(mockSendMessage).toBeCalled();
    const decodedMessage = JSON.parse(
      Buffer.from(mockSendMessage.mock.calls[0][0], "base64").toString("ascii")
    );
    expect(NotifyMessage.decode(decodedMessage).isRight()).toBeTruthy();
  });

  it("should fail if the Queue Storage fails on notify", async () => {
    mockSendMessage.mockImplementation(_ => Promise.reject(genericError));

    const service = new NotificationService("", "");

    const res = await service.notify(aValidNotification, aNotificationSubject);

    expect(res).toEqual({
      apply: expect.any(Function),
      detail: expect.anything(),
      kind: "IResponseErrorInternal"
    });
    expect(mockSendMessage).toBeCalled();
    const decodedMessage = JSON.parse(
      Buffer.from(mockSendMessage.mock.calls[0][0], "base64").toString("ascii")
    );
    expect(NotifyMessage.decode(decodedMessage).isRight()).toBeTruthy();
  });
});

describe("NotificationService#deleteInstallation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const expectedDeleteInstallationMessage: DeleteInstallationMessage = {
    installationId: aFiscalCodeHash as NonEmptyString,
    kind: DeleteKind.DeleteInstallation
  };

  it("should submit a delete installation message to the Queue Storage", async () => {
    mockSendMessage.mockImplementation(_ => Promise.resolve());
    const service = new NotificationService("", "");

    const res = await service.deleteInstallation(aFiscalCode);

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });

    expect(mockSendMessage).toBeCalledWith(
      base64EncodeObject(expectedDeleteInstallationMessage)
    );
  });

  it("should fail if the Queue Storage fails on deleteInstallation", async () => {
    mockSendMessage.mockImplementation(_ => Promise.reject(genericError));
    const service = new NotificationService("", "");

    const res = await service.deleteInstallation(aFiscalCode);

    expect(res).toEqual({
      apply: expect.any(Function),
      detail: expect.anything(),
      kind: "IResponseErrorInternal"
    });

    expect(mockSendMessage).toBeCalledWith(
      base64EncodeObject(expectedDeleteInstallationMessage)
    );
  });
});
