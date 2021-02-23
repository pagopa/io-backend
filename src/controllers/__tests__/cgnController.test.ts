import { ResponseSuccessAccepted, ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import CgnController from "../cgnController";
import { CgnAPIClient } from "../../clients/cgn";
import CgnService from "../../services/cgnService";
import { CardPending, StatusEnum } from "../../../generated/io-cgn-api/CardPending";
import { CgnActivationDetail, StatusEnum as ActivationStatusEnum } from "../../../generated/io-cgn-api/CgnActivationDetail";
import { EycaActivationDetail } from "../../../generated/io-cgn-api/EycaActivationDetail";

const API_KEY = "";
const API_URL = "";

const aTimestamp = 1518010929530;
const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidName = "Giuseppe Maria" as NonEmptyString;
const aValidFamilyname = "Garibaldi" as NonEmptyString;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: aValidFamilyname,
  fiscal_code: aFiscalCode,
  name: aValidName,
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "123hexToken" as WalletToken
};

const mockGetCgnStatus = jest.fn();
const mockGetEycaStatus = jest.fn();
const mockStartCgnActivation = jest.fn();
const mockGetCgnActivation = jest.fn();
const mockGetEycaActivation = jest.fn();
const mockStartEycaActivation = jest.fn();
jest.mock("../../services/cgnService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getCgnActivation: mockGetCgnActivation,
      getCgnStatus: mockGetCgnStatus,
      getEycaActivation: mockGetEycaActivation,
      startCgnActivation: mockStartCgnActivation,
      startEycaActivation: mockStartEycaActivation,
      getEycaStatus: mockGetEycaStatus
    }))
  };
});

const aPendingCgn: CardPending = {
  status: StatusEnum.PENDING
}

const aPendingEycaCard: CardPending = {
  status: StatusEnum.PENDING
}

const aCgnActivationDetail: CgnActivationDetail = {
  instance_id: {
    id: "instanceId" as NonEmptyString
  },
  status: ActivationStatusEnum.COMPLETED
}

const anEycaActivationDetail: EycaActivationDetail = {
  status: ActivationStatusEnum.COMPLETED
}

describe("CgnController#getCgnStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    await controller.getCgnStatus(req);

    expect(mockGetCgnStatus).toHaveBeenCalledWith(mockedUser);
  });

  it("should call getCgnStatus method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGetCgnStatus.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aPendingCgn))
    );

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.getCgnStatus(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aPendingCgn
    });
  });

  it("should not call getCgnStatus method on the CgnService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.getCgnStatus(req);

    response.apply(res);

    // service method is not called
    expect(mockGetCgnStatus).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("CgnController#getEycaStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    await controller.getEycaStatus(req);

    expect(mockGetEycaStatus).toHaveBeenCalledWith(mockedUser);
  });

  it("should call getEycaStatus method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGetEycaStatus.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aPendingEycaCard))
    );

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.getEycaStatus(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aPendingEycaCard
    });
  });

  it("should not call getEycaStatus method on the CgnService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.getEycaStatus(req);

    response.apply(res);

    // service method is not called
    expect(mockGetEycaStatus).not.toBeCalled();

    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("CgnController#startCgnActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    await controller.startCgnActivation(req);

    expect(mockStartCgnActivation).toHaveBeenCalledWith(mockedUser);
  });

  it("should call startCgnActivation method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockStartCgnActivation.mockReturnValue(
      Promise.resolve(ResponseSuccessAccepted())
    );

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.startCgnActivation(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessAccepted",
      value: undefined
    });
  });

  it("should not call startCgnActivation method on the CgnService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.startCgnActivation(req);

    response.apply(res);

    // service method is not called
    expect(mockStartCgnActivation).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("CgnController#getCgnActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    await controller.getCgnActivation(req);

    expect(mockGetCgnActivation).toHaveBeenCalledWith(mockedUser);
  });

  it("should call getCgnActivation method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGetCgnActivation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aCgnActivationDetail))
    );

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.getCgnActivation(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aCgnActivationDetail
    });
  });

  it("should not call startCgnActivation method on the CgnService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.getCgnActivation(req);

    response.apply(res);

    // service method is not called
    expect(mockGetCgnActivation).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("CgnController#getEycaActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    await controller.getEycaActivation(req);

    expect(mockGetEycaActivation).toHaveBeenCalledWith(mockedUser);
  });

  it("should call getEycaActivation method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGetEycaActivation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(anEycaActivationDetail))
    );

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.getEycaActivation(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: anEycaActivationDetail
    });
  });

  it("should not call getEycaActivation method on the CgnService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.getEycaActivation(req);

    response.apply(res);

    // service method is not called
    expect(mockGetEycaActivation).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("CgnController#startEycaActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    await controller.startEycaActivation(req);

    expect(mockStartEycaActivation).toHaveBeenCalledWith(mockedUser);
  });

  it("should call startEycaActivation method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockStartEycaActivation.mockReturnValue(
      Promise.resolve(ResponseSuccessAccepted())
    );

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.startEycaActivation(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessAccepted",
      value: undefined
    });
  });

  it("should not call startEycaActivation method on the CgnService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.startEycaActivation(req);

    response.apply(res);

    // service method is not called
    expect(mockStartEycaActivation).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});
