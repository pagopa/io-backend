/* tslint:disable:no-object-mutation */
import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, EmailString } from "@pagopa/ts-commons/lib/strings";
import { InstallationID } from "../../../generated/backend/InstallationID";
import { PlatformEnum } from "../../../generated/backend/Platform";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import NotificationService from "../../services/notificationService";
import { User } from "../../types/user";
import NotificationController from "../notificationController";

import { mockedUser } from "../../__mocks__/user_mock";

const anInvalidFiscalNumber = "xxx" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailString;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
const aValidInstallationID =
  "550e8400e29b41d4a716446655440000" as InstallationID;
const anInvalidInstallationID = "" as InstallationID;

const mockedInvalidUser: User = {
  date_of_birth: "2002-01-01",
  family_name: "Garibaldi",
  fiscal_code: anInvalidFiscalNumber,
  name: "Giuseppe Maria",
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel
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

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

jest.mock("../../services/notificationService");

const notificationService = new NotificationService("", "");
const notificationServiceFactory = (_fc: FiscalCode) => notificationService;

// tslint:disable-next-line: no-any
const mockCreateOrUpdateInstallation = ((
  notificationService as any
).createOrUpdateInstallation = jest.fn());

const controller = new NotificationController(notificationServiceFactory);

describe("NotificationController#createOrUpdateInstallation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success if data is correct", async () => {
    const req = mockReq();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.user = mockedUser;
    req.params = { id: aValidInstallationID };
    req.body = anAppleDevice;

    const res = await controller.createOrUpdateInstallation(req);

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
  });

  it("should fail if cannot decode the user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.user = mockedInvalidUser;
    req.params = { id: aValidInstallationID };
    req.body = anAppleDevice;

    const response = await controller.createOrUpdateInstallation(req);
    response.apply(res);

    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should fail if cannot decode the Installation ID", async () => {
    const req = mockReq();
    const res = mockRes();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.user = mockedUser;
    req.params = { id: anInvalidInstallationID };
    req.body = anAppleDevice;

    const response = await controller.createOrUpdateInstallation(req);
    response.apply(res);

    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should fail if cannot decode the installation data", async () => {
    const req = mockReq();
    const res = mockRes();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.user = mockedUser;
    req.params = { id: aValidInstallationID };
    req.body = anInvalidDevice;

    const response = await controller.createOrUpdateInstallation(req);
    response.apply(res);

    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});
