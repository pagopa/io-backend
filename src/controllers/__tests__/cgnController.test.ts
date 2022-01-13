import {
  ResponseSuccessAccepted,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { mockedUser } from "../../__mocks__/user_mock";
import CgnController from "../cgnController";
import { CgnAPIClient } from "../../clients/cgn";
import CgnService from "../../services/cgnService";
import {
  CardPending,
  StatusEnum
} from "../../../generated/io-cgn-api/CardPending";
import {
  CgnActivationDetail,
  StatusEnum as ActivationStatusEnum
} from "../../../generated/io-cgn-api/CgnActivationDetail";
import { EycaActivationDetail } from "../../../generated/io-cgn-api/EycaActivationDetail";
import { Otp } from "../../../generated/cgn/Otp";
import { OtpCode } from "../../../generated/cgn/OtpCode";

const API_KEY = "";
const API_URL = "";
const API_BASE_PATH = "";

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

const mockGetCgnStatus = jest.fn();
const mockGetEycaStatus = jest.fn();
const mockStartCgnActivation = jest.fn();
const mockGetCgnActivation = jest.fn();
const mockGetEycaActivation = jest.fn();
const mockStartEycaActivation = jest.fn();

const mockGenerateOtp = jest.fn();
jest.mock("../../services/cgnService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getCgnActivation: mockGetCgnActivation,
      getCgnStatus: mockGetCgnStatus,
      getEycaActivation: mockGetEycaActivation,
      startCgnActivation: mockStartCgnActivation,
      startEycaActivation: mockStartEycaActivation,
      getEycaStatus: mockGetEycaStatus,
      generateOtp: mockGenerateOtp
    }))
  };
});

const aPendingCgn: CardPending = {
  status: StatusEnum.PENDING
};

const aPendingEycaCard: CardPending = {
  status: StatusEnum.PENDING
};

const aCgnActivationDetail: CgnActivationDetail = {
  instance_id: {
    id: "instanceId" as NonEmptyString
  },
  status: ActivationStatusEnum.COMPLETED
};

const anEycaActivationDetail: EycaActivationDetail = {
  status: ActivationStatusEnum.COMPLETED
};

const allowedTestFiscalCodesMock = jest.fn().mockImplementation(() => []);
const aGeneratedOtp: Otp = {
  code: "AAAAAA12312" as OtpCode,
  expires_at: new Date(),
  ttl: 10
};

const client = CgnAPIClient(API_KEY, API_URL, API_BASE_PATH);
const cgnService = new CgnService(client);

describe("CgnController#getCgnStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    await controller.getCgnStatus(req);

    expect(mockGetCgnStatus).toHaveBeenCalledWith(mockedUser);
  });

  it("should call getCgnStatus method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGetCgnStatus.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aPendingCgn))
    );

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

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

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.getCgnStatus(req);

    response.apply(res);

    // service method is not called
    expect(mockGetCgnStatus).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should not call getCgnStatus method on the CgnService with Not allowed user", async () => {
    const req = { ...mockReq(), user: mockedUser };

    allowedTestFiscalCodesMock.mockImplementationOnce(() => [
      "GRBGPP87L04L741Z" as FiscalCode
    ]);

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.getCgnStatus(req);

    // service method is not called
    expect(mockGetCgnStatus).not.toBeCalled();
    expect(response).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });
});

describe("CgnController#getEycaStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    await controller.getEycaStatus(req);

    expect(mockGetEycaStatus).toHaveBeenCalledWith(mockedUser);
  });

  it("should call getEycaStatus method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGetEycaStatus.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aPendingEycaCard))
    );

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

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

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.getEycaStatus(req);

    response.apply(res);

    // service method is not called
    expect(mockGetEycaStatus).not.toBeCalled();

    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should not call getEycaStatus method on the CgnService with Not allowed user", async () => {
    const req = { ...mockReq(), user: mockedUser };

    allowedTestFiscalCodesMock.mockImplementationOnce(() => [
      "GRBGPP87L04L741Z" as FiscalCode
    ]);

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.getEycaStatus(req);

    // service method is not called
    expect(mockGetEycaStatus).not.toBeCalled();
    expect(response).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });
});

describe("CgnController#startCgnActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    await controller.startCgnActivation(req);

    expect(mockStartCgnActivation).toHaveBeenCalledWith(mockedUser);
  });

  it("should call startCgnActivation method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockStartCgnActivation.mockReturnValue(
      Promise.resolve(ResponseSuccessAccepted())
    );

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

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

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.startCgnActivation(req);

    response.apply(res);

    // service method is not called
    expect(mockStartCgnActivation).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should not call startCgnActivation method on the CgnService with Not allowed user", async () => {
    const req = { ...mockReq(), user: mockedUser };

    allowedTestFiscalCodesMock.mockImplementationOnce(() => [
      "GRBGPP87L04L741Z" as FiscalCode
    ]);

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.startCgnActivation(req);

    // service method is not called
    expect(mockStartCgnActivation).not.toBeCalled();
    expect(response).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });
});

describe("CgnController#getCgnActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    await controller.getCgnActivation(req);

    expect(mockGetCgnActivation).toHaveBeenCalledWith(mockedUser);
  });

  it("should call getCgnActivation method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGetCgnActivation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aCgnActivationDetail))
    );

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.getCgnActivation(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aCgnActivationDetail
    });
  });

  it("should not call getCgnActivation method on the CgnService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.getCgnActivation(req);

    response.apply(res);

    // service method is not called
    expect(mockGetCgnActivation).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
  it("should not call getCgnActivation method on the CgnService with Not allowed user", async () => {
    const req = { ...mockReq(), user: mockedUser };

    allowedTestFiscalCodesMock.mockImplementationOnce(() => [
      "GRBGPP87L04L741Z" as FiscalCode
    ]);

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.getCgnActivation(req);

    // service method is not called
    expect(mockGetCgnActivation).not.toBeCalled();
    expect(response).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });
});

describe("CgnController#getEycaActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    await controller.getEycaActivation(req);

    expect(mockGetEycaActivation).toHaveBeenCalledWith(mockedUser);
  });

  it("should call getEycaActivation method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGetEycaActivation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(anEycaActivationDetail))
    );

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

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

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.getEycaActivation(req);

    response.apply(res);

    // service method is not called
    expect(mockGetEycaActivation).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should not call getEycaActivation method on the CgnService with Not allowed user", async () => {
    const req = { ...mockReq(), user: mockedUser };

    allowedTestFiscalCodesMock.mockImplementationOnce(() => [
      "GRBGPP87L04L741Z" as FiscalCode
    ]);

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.getEycaActivation(req);

    // service method is not called
    expect(mockGetEycaActivation).not.toBeCalled();
    expect(response).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });
});

describe("CgnController#startEycaActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    await controller.startEycaActivation(req);

    expect(mockStartEycaActivation).toHaveBeenCalledWith(mockedUser);
  });

  it("should call startEycaActivation method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockStartEycaActivation.mockReturnValue(
      Promise.resolve(ResponseSuccessAccepted())
    );

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

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

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.startEycaActivation(req);

    response.apply(res);

    // service method is not called
    expect(mockStartEycaActivation).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
  it("should not call startEycaActivation method on the CgnService with Not allowed user", async () => {
    const req = { ...mockReq(), user: mockedUser };

    allowedTestFiscalCodesMock.mockImplementationOnce(() => [
      "GRBGPP87L04L741Z" as FiscalCode
    ]);

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.startEycaActivation(req);

    // service method is not called
    expect(mockStartEycaActivation).not.toBeCalled();
    expect(response).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });
});

describe("CgnController#generateOtp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    await controller.generateOtp(req);

    expect(mockGenerateOtp).toHaveBeenCalledWith(mockedUser);
  });

  it("should call generateOtp method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGenerateOtp.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aGeneratedOtp))
    );

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.generateOtp(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aGeneratedOtp
    });
  });

  it("should not call generateOtp method on the CgnService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const controller = new CgnController(
      cgnService,
      allowedTestFiscalCodesMock()
    );

    const response = await controller.generateOtp(req);

    response.apply(res);

    // service method is not called
    expect(mockGenerateOtp).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});
