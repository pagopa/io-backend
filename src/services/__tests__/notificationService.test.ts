/* tslint:disable:no-null-keyword */

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { PlatformEnum } from "../../../generated/backend/Platform";
import {
  CreateOrUpdateInstallationMessage,
  KindEnum as CreateOrUpdateKind
} from "../../../generated/messages/CreateOrUpdateInstallationMessage";
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
    mockSendMessage.mockImplementation((_) => Promise.resolve());

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
    mockSendMessage.mockImplementation((_) => Promise.resolve());

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
    mockSendMessage.mockImplementation((_) => Promise.reject(genericError));

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
