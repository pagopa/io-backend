import * as t from "io-ts";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { EmailAddress } from "../../../generated/auth/EmailAddress";
import { CgnAPIClient } from "../../clients/cgn";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import CgnService from "../cgnService";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import {
  CardPending,
  StatusEnum
} from "../../../generated/io-cgn-api/CardPending";
import { Otp } from "../../../generated/cgn/Otp";
import { OtpCode } from "../../../generated/cgn/OtpCode";

const aValidFiscalCode = "XUZTCT88A51Y311X" as FiscalCode;
const aValidSPIDEmail = "from_spid@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

const mockGetCgnStatus = jest.fn();
const mockGetEycaStatus = jest.fn();
const mockStartCgnActivation = jest.fn();
const mockGetCgnActivation = jest.fn();
const mockStartEycaActivation = jest.fn();
const mockGetEycaActivation = jest.fn();
const mockGenerateOtp = jest.fn();

mockGetCgnStatus.mockImplementation(() =>
  t.success({ status: 200, value: aPendingCgn })
);

mockGetEycaStatus.mockImplementation(() =>
  t.success({ status: 200, value: aPendingEycaCard })
);

mockStartCgnActivation.mockImplementation(() =>
  t.success({
    status: 201,
    headers: { Location: "/api/v1/cgn/activation" },
    value: {
      id: {
        id: "AnInstanceId"
      }
    }
  })
);

mockGetCgnActivation.mockImplementation(() => t.success({ status: 200 }));

mockGetEycaActivation.mockImplementation(() => t.success({ status: 200 }));

mockStartEycaActivation.mockImplementation(() =>
  t.success({
    status: 201,
    headers: { Location: "/api/v1/cgn/eyca/activation" },
    value: {
      id: {
        id: "AnInstanceId"
      }
    }
  })
);

mockGenerateOtp.mockImplementation(() =>
  t.success({ status: 200, value: aGeneratedOtp })
);

const api = {
  generateOtp: mockGenerateOtp,
  getCgnActivation: mockGetCgnActivation,
  getCgnStatus: mockGetCgnStatus,
  getEycaStatus: mockGetEycaStatus,
  getEycaActivation: mockGetEycaActivation,
  startCgnActivation: mockStartCgnActivation,
  startEycaActivation: mockStartEycaActivation,
  upsertCgnStatus: jest.fn()
} as ReturnType<CgnAPIClient>;

const mockedUser: User = {
  created_at: 1183518855,
  family_name: "Lusso",
  fiscal_code: aValidFiscalCode,
  name: "Luca",
  session_token: "HexToKen" as SessionToken,
  spid_email: aValidSPIDEmail,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "HexToKen" as WalletToken
};

const aPendingCgn: CardPending = {
  status: StatusEnum.PENDING
};
const aPendingEycaCard: CardPending = {
  status: StatusEnum.PENDING
};

const aGeneratedOtp: Otp = {
  code: "AAAAAA12312" as OtpCode,
  expires_at: new Date(),
  ttl: 10
};
describe("CgnService#getCgnStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new CgnService(api);

    await service.getCgnStatus(mockedUser);

    expect(mockGetCgnStatus).toHaveBeenCalledWith({
      fiscalcode: mockedUser.fiscal_code
    });
  });

  it("should handle a success response", async () => {
    const service = new CgnService(api);

    const res = await service.getCgnStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the client returns 401", async () => {
    mockGetCgnStatus.mockImplementationOnce(() => t.success({ status: 401 }));

    const service = new CgnService(api);

    const res = await service.getCgnStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a not found error when the CGN is not found", async () => {
    mockGetCgnStatus.mockImplementationOnce(() => t.success({ status: 404 }));

    const service = new CgnService(api);

    const res = await service.getCgnStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetCgnStatus.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnService(api);

    const res = await service.getCgnStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetCgnStatus.mockImplementationOnce(() => t.success({ status: 123 }));
    const service = new CgnService(api);

    const res = await service.getCgnStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetCgnStatus.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new CgnService(api);

    const res = await service.getCgnStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("CgnService#getEycaStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new CgnService(api);

    await service.getEycaStatus(mockedUser);

    expect(mockGetEycaStatus).toHaveBeenCalledWith({
      fiscalcode: mockedUser.fiscal_code
    });
  });

  it("should handle a success response", async () => {
    const service = new CgnService(api);

    const res = await service.getEycaStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the client returns 401", async () => {
    mockGetEycaStatus.mockImplementationOnce(() => t.success({ status: 401 }));

    const service = new CgnService(api);

    const res = await service.getEycaStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a Forbidden error when the client returns 403", async () => {
    mockGetEycaStatus.mockImplementationOnce(() => t.success({ status: 403 }));

    const service = new CgnService(api);

    const res = await service.getEycaStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });

  it("should handle a not found error when the Eyca Card is not found", async () => {
    mockGetEycaStatus.mockImplementationOnce(() => t.success({ status: 404 }));

    const service = new CgnService(api);

    const res = await service.getEycaStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle a Conflict error when the client returns 409", async () => {
    mockGetEycaStatus.mockImplementationOnce(() => t.success({ status: 409 }));

    const service = new CgnService(api);

    const res = await service.getEycaStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorConflict"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetEycaStatus.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnService(api);

    const res = await service.getEycaStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetEycaStatus.mockImplementationOnce(() => t.success({ status: 123 }));
    const service = new CgnService(api);

    const res = await service.getEycaStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetEycaStatus.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new CgnService(api);

    const res = await service.getEycaStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("CgnService#startCgnActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new CgnService(api);

    await service.startCgnActivation(mockedUser);

    expect(mockStartCgnActivation).toHaveBeenCalledWith({
      fiscalcode: mockedUser.fiscal_code
    });
  });

  it("should handle a success redirect to resource response", async () => {
    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessRedirectToResource"
    });
  });

  it("should handle a success Accepted response", async () => {
    mockStartCgnActivation.mockImplementationOnce(() =>
      t.success({ status: 202 })
    );

    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessAccepted"
    });
  });

  it("should handle an internal error when the client returns 401", async () => {
    mockStartCgnActivation.mockImplementationOnce(() =>
      t.success({ status: 401 })
    );
    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a Forbidden error if the user is ineligible for a CGN", async () => {
    mockStartCgnActivation.mockImplementationOnce(() =>
      t.success({ status: 403 })
    );

    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });

  it("should handle a conflict error when the CGN is already activated", async () => {
    mockStartCgnActivation.mockImplementationOnce(() =>
      t.success({ status: 409 })
    );

    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorConflict"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockStartCgnActivation.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockStartCgnActivation.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockStartCgnActivation.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("CgnService#getCgnActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new CgnService(api);

    await service.getCgnActivation(mockedUser);

    expect(mockGetCgnActivation).toHaveBeenCalledWith({
      fiscalcode: mockedUser.fiscal_code
    });
  });

  it("should handle a success redirect to resource response", async () => {
    const service = new CgnService(api);

    const res = await service.getCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the client returns 401", async () => {
    mockGetCgnActivation.mockImplementationOnce(() =>
      t.success({ status: 401 })
    );

    const service = new CgnService(api);

    const res = await service.getCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a Not Found Error when no CGN activation infos are found", async () => {
    mockGetCgnActivation.mockImplementationOnce(() =>
      t.success({ status: 404 })
    );

    const service = new CgnService(api);

    const res = await service.getCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetCgnActivation.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnService(api);

    const res = await service.getCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetCgnActivation.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new CgnService(api);

    const res = await service.getCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetCgnActivation.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new CgnService(api);

    const res = await service.getCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("CgnService#getEycaActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new CgnService(api);

    await service.getEycaActivation(mockedUser);

    expect(mockGetEycaActivation).toHaveBeenCalledWith({
      fiscalcode: mockedUser.fiscal_code
    });
  });

  it("should handle a success response", async () => {
    const service = new CgnService(api);

    const res = await service.getEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the client returns 401", async () => {
    mockGetEycaActivation.mockImplementationOnce(() =>
      t.success({ status: 401 })
    );

    const service = new CgnService(api);

    const res = await service.getEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a Not Found Error when no CGN activation infos are found", async () => {
    mockGetEycaActivation.mockImplementationOnce(() =>
      t.success({ status: 404 })
    );

    const service = new CgnService(api);

    const res = await service.getEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetEycaActivation.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnService(api);

    const res = await service.getEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetEycaActivation.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new CgnService(api);

    const res = await service.getEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetEycaActivation.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new CgnService(api);

    const res = await service.getEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("CgnService#startEycaActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new CgnService(api);

    await service.startEycaActivation(mockedUser);

    expect(mockStartEycaActivation).toHaveBeenCalledWith({
      fiscalcode: mockedUser.fiscal_code
    });
  });

  it("should handle a success redirect to resource response", async () => {
    const service = new CgnService(api);

    const res = await service.startEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessRedirectToResource"
    });
  });

  it("should handle a success Accepted response", async () => {
    mockStartEycaActivation.mockImplementationOnce(() =>
      t.success({ status: 202 })
    );

    const service = new CgnService(api);

    const res = await service.startEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessAccepted"
    });
  });

  it("should handle an internal error when the client returns 401", async () => {
    mockStartEycaActivation.mockImplementationOnce(() =>
      t.success({ status: 401 })
    );
    const service = new CgnService(api);

    const res = await service.startEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a Forbidden error if the user is ineligible for an EYCA Card", async () => {
    mockStartEycaActivation.mockImplementationOnce(() =>
      t.success({ status: 403 })
    );

    const service = new CgnService(api);

    const res = await service.startEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });

  it("should handle a conflict error when the EYCA Card is already activated", async () => {
    mockStartEycaActivation.mockImplementationOnce(() =>
      t.success({ status: 409 })
    );

    const service = new CgnService(api);

    const res = await service.startEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorConflict"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockStartEycaActivation.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnService(api);

    const res = await service.startEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockStartEycaActivation.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new CgnService(api);

    const res = await service.startEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockStartEycaActivation.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new CgnService(api);

    const res = await service.startEycaActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("CgnService#generateOtp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new CgnService(api);

    await service.generateOtp(mockedUser);

    expect(mockGenerateOtp).toHaveBeenCalledWith({
      fiscalcode: mockedUser.fiscal_code
    });
  });

  it("should handle a success response", async () => {
    const service = new CgnService(api);

    const res = await service.generateOtp(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the client returns 401", async () => {
    mockGenerateOtp.mockImplementationOnce(() => t.success({ status: 401 }));

    const service = new CgnService(api);

    const res = await service.generateOtp(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a Forbidden error when the client returns 403", async () => {
    mockGenerateOtp.mockImplementationOnce(() => t.success({ status: 403 }));

    const service = new CgnService(api);

    const res = await service.generateOtp(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGenerateOtp.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnService(api);

    const res = await service.generateOtp(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGenerateOtp.mockImplementationOnce(() => t.success({ status: 123 }));
    const service = new CgnService(api);

    const res = await service.generateOtp(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGenerateOtp.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new CgnService(api);

    const res = await service.generateOtp(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});
