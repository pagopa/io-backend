import { left, right } from "fp-ts/lib/Either";
import mockReq from "../../__mocks__/request";
import NotificationService from "../../services/notificationService";
import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { DevicePlatformEnum, InstallationID } from "../../types/notification";
import { SpidLevelEnum } from "../../types/spidLevel";
import { User } from "../../types/user";
import NotificationController from "../notificationController";

const aTimestamp = 1518010929530;
const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anInvalidFiscalNumber = "xxx" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum.SPID_L2;
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
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  token: "123hexToken"
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
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  token: "123hexToken"
};

const aValidNotification = {
  message: {
    content: {
      markdown: "test".repeat(80),
      subject: "this is a message"
    },
    fiscalCode: aFiscalNumber,
    senderServiceId: "234567"
  },
  senderMetadata: {
    departmentName: "test department",
    organizationName: "test organization",
    serviceName: "test service"
  }
};

const anInvalidNotification = {
  message: {
    content: {
      markdown: "invalid",
      subject: "this is a message"
    },
    fiscalCode: anInvalidFiscalNumber,
    senderServiceId: "234567"
  },
  senderMetadata: {
    departmentName: "test department",
    organizationName: "test organization",
    serviceName: "test service"
  }
};

const aPushChannel =
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000";
const anAppleDevice = {
  platform: DevicePlatformEnum.apns,
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
    mockNotify.mockReturnValue(
      Promise.resolve(
        right({
          body: "ok",
          status: 200
        })
      )
    );

    req.user = mockedUser;
    req.body = aValidNotification;

    const res = await controller.notify(req);

    expect(res).toEqual(
      right({
        body: "ok",
        status: 200
      })
    );
  });

  it("should fail if cannot decode the user", async () => {
    const req = mockReq();
    mockNotify.mockReturnValue(
      Promise.resolve(
        right({
          body: "ok",
          status: 200
        })
      )
    );

    req.user = mockedInvalidUser;
    req.params = { id: aValidInstallationID };
    req.body = anAppleDevice;

    const res = await controller.notify(req);

    expect(res).toEqual(left(new Error("Unable to decode the user")));
  });

  it("should fail if cannot decode the notification", async () => {
    const req = mockReq();
    mockNotify.mockReturnValue(
      Promise.resolve(
        right({
          body: "ok",
          status: 200
        })
      )
    );

    req.user = mockedUser;
    req.body = anInvalidNotification;

    const res = await controller.notify(req);

    expect(res).toEqual(
      left(new Error("Unable to parse the notification body"))
    );
  });
});

describe("NotificationController#createOrUpdateInstallation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success if data is correct", async () => {
    const req = mockReq();
    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(
        right({
          body: "ok",
          status: 200
        })
      )
    );

    req.user = mockedUser;
    req.params = { id: aValidInstallationID };
    req.body = anAppleDevice;

    const res = await controller.createOrUpdateInstallation(req);

    expect(res).toEqual(
      right({
        body: "ok",
        status: 200
      })
    );
  });

  it("should fail if cannot decode the user", async () => {
    const req = mockReq();
    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(
        right({
          body: "ok",
          status: 200
        })
      )
    );

    req.user = mockedInvalidUser;
    req.params = { id: aValidInstallationID };
    req.body = anAppleDevice;

    const res = await controller.createOrUpdateInstallation(req);

    expect(res).toEqual(left(new Error("Unable to decode the user")));
  });

  it("should fail if cannot decode the Installation ID", async () => {
    const req = mockReq();
    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(
        right({
          body: "ok",
          status: 200
        })
      )
    );

    req.user = mockedUser;
    req.params = { id: anInvalidInstallationID };
    req.body = anAppleDevice;

    const res = await controller.createOrUpdateInstallation(req);

    expect(res).toEqual(left(new Error("Unable to parse the installation ID")));
  });

  it("should fail if cannot decode the device data", async () => {
    const req = mockReq();
    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(
        right({
          body: "ok",
          status: 200
        })
      )
    );

    req.user = mockedUser;
    req.params = { id: aValidInstallationID };
    req.body = anInvalidDevice;

    const res = await controller.createOrUpdateInstallation(req);

    expect(res).toEqual(left(new Error("Unable to parse the device data")));
  });
});
