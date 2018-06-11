import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { SessionToken, WalletToken } from "../../services/ISessionStorage";
import NotificationService from "../../services/notificationService";
import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { InstallationID } from "../../types/api/InstallationID";
import { PlatformEnum } from "../../types/api/Platform";
import { SpidLevelEnum } from "../../types/api/SpidLevel";
import { User } from "../../types/user";
import NotificationController from "../notificationController";

const aTimestamp = 1518010929530;
const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anInvalidFiscalNumber = "xxx" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
const aValidInstallationID = "550e8400-e29b-41d4-a716-446655440000" as InstallationID;
const anInvalidInstallationID = "invalid" as InstallationID;

const mockedUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: anEmailAddress,
  sessionIndex: "123sessionIndex",
  session_token: "123hexToken" as SessionToken,
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  wallet_token: "123hexToken" as WalletToken
};

const mockedInvalidUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: anInvalidFiscalNumber,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: anEmailAddress,
  sessionIndex: "123sessionIndex",
  session_token: "123hexToken" as SessionToken,
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  wallet_token: "123hexToken" as WalletToken
};

const aValidNotification = {
  message: {
    content: {
      markdown: "test".repeat(80),
      subject: "this is a message"
    },
    created_at: new Date(),
    fiscal_code: aFiscalNumber,
    id: "01CCKCY7QQ7WCHWTH8NB504386",
    sender_service_id: "234567"
  },
  senderMetadata: {
    department_name: "test department",
    organization_name: "test organization",
    service_name: "test service"
  }
};

const anInvalidNotification = {
  message: {
    content: {
      markdown: "invalid",
      subject: "this is a message"
    },
    created_at: new Date(),
    fiscal_code: anInvalidFiscalNumber,
    sender_service_id: "234567"
  },
  senderMetadata: {
    department_name: "test department",
    organization_name: "test organization",
    service_name: "test service"
  }
};

const anErrorResponse = {
  detail: undefined,
  status: 500,
  title: "Internal server error",
  type: undefined
};
const aPushChannel =
  "fLKP3EATnBI:APA91bEy4go681jeSEpLkNqhtIrdPnEKu6Dfi-STtUiEnQn8RwMfBiPGYaqdWrmzJyXIh5Yms4017MYRS9O1LGPZwA4sOLCNIoKl4Fwg7cSeOkliAAtlQ0rVg71Kr5QmQiLlDJyxcq3p";
const anAppleDevice = {
  platform: PlatformEnum.apns,
  pushChannel: aPushChannel
};
const anInvalidDevice = {
  platform: "invalid"
};

const mockCreateOrUpdateInstallation = jest.fn();
const mockNotify = jest.fn();
jest.mock("../../services/notificationService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createOrUpdateInstallation: mockCreateOrUpdateInstallation,
      notify: mockNotify
    }))
  };
});

const notificationService = new NotificationService("", "");
const controller = new NotificationController(notificationService);

describe("NotificationController#notify", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success if data is correct", async () => {
    const req = mockReq();

    mockNotify.mockReturnValue(Promise.resolve(ResponseSuccessJson("ok")));

    req.body = aValidNotification;

    const res = await controller.notify(req);

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: "ok"
    });
  });

  it("should fail if cannot decode the notification", async () => {
    const req = mockReq();
    const res = mockRes();

    mockNotify.mockReturnValue(Promise.resolve(ResponseSuccessJson("ok")));

    req.body = anInvalidNotification;

    const response = await controller.notify(req);
    response.apply(res);

    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Unable to parse the notification body"
    });
  });
});

describe("NotificationController#createOrUpdateInstallation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success if data is correct", async () => {
    const req = mockReq();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson("ok"))
    );

    req.user = mockedUser;
    req.params = { id: aValidInstallationID };
    req.body = anAppleDevice;

    const res = await controller.createOrUpdateInstallation(req);

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: "ok"
    });
  });

  it("should fail if cannot decode the user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson("ok"))
    );

    req.user = mockedInvalidUser;
    req.params = { id: aValidInstallationID };
    req.body = anAppleDevice;

    const response = await controller.createOrUpdateInstallation(req);
    response.apply(res);

    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Unable to decode the user"
    });
  });

  it("should fail if cannot decode the Installation ID", async () => {
    const req = mockReq();
    const res = mockRes();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson("ok"))
    );

    req.user = mockedUser;
    req.params = { id: anInvalidInstallationID };
    req.body = anAppleDevice;

    const response = await controller.createOrUpdateInstallation(req);
    response.apply(res);

    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Unable to parse the installation ID"
    });
  });

  it("should fail if cannot decode the installation data", async () => {
    const req = mockReq();
    const res = mockRes();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson("ok"))
    );

    req.user = mockedUser;
    req.params = { id: aValidInstallationID };
    req.body = anInvalidDevice;

    const response = await controller.createOrUpdateInstallation(req);
    response.apply(res);

    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Unable to parse the installation data"
    });
  });
});
