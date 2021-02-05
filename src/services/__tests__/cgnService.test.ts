import * as t from "io-ts";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { EmailAddress } from "../../../generated/auth/EmailAddress";
import { CgnAPIClient } from "../../clients/cgn";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import CgnService from "../cgnService";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { CgnPendingStatus, StatusEnum } from "../../../generated/io-cgn-api/CgnPendingStatus";

const aValidFiscalCode = "XUZTCT88A51Y311X" as FiscalCode;
const aValidSPIDEmail = "from_spid@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

const mockGetCgnStatus = jest.fn();
const mockStartCgnActivation = jest.fn();
const mockGetCgnActivation = jest.fn();

const mockCgnAPIClient = {
  getCgnActivation: mockGetCgnActivation,
  getCgnStatus: mockGetCgnStatus,
  startCgnActivation: mockStartCgnActivation,
  upsertCgnStatus: jest.fn()
} as ReturnType<CgnAPIClient>;

const api = mockCgnAPIClient;

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

const aPendingCgnStatus: CgnPendingStatus = {
    status: StatusEnum.PENDING
}
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
        mockGetCgnStatus.mockImplementation(() =>
        t.success({status: 200, value:aPendingCgnStatus})
      );
  
      const service = new CgnService(api);
  
      const res = await service.getCgnStatus(mockedUser);
  
      expect(res).toMatchObject({
        kind: "IResponseSuccessJson"
      });
    });

    it("should handle an internal error when the client returns 401", async () => {
        mockGetCgnStatus.mockImplementation(() =>
        t.success({ status: 401 })
      );
  
      const service = new CgnService(api);
  
      const res = await service.getCgnStatus(mockedUser);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  
    it("should handle a not found error when the CGN is not found", async () => {
        mockGetCgnStatus.mockImplementation(() =>
        t.success({ status: 404 })
      );
  
      const service = new CgnService(api);
  
      const res = await service.getCgnStatus(mockedUser);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorNotFound"
      });
    });
  
    it("should handle an internal error response", async () => {
      const aGenericProblem = {};
      mockGetCgnStatus.mockImplementation(() =>
        t.success({ status: 500, value: aGenericProblem })
      );
  
      const service = new CgnService(api);
  
      const res = await service.getCgnStatus(mockedUser);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  
    it("should return an error for unhandled response status code", async () => {
        mockGetCgnStatus.mockImplementation(() =>
        t.success({ status: 123 })
      );
      const service = new CgnService(api);
  
      const res = await service.getCgnStatus(mockedUser);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  
    it("should return an error if the api call thows", async () => {
        mockGetCgnStatus.mockImplementation(() => {
        throw new Error();
      });
      const service = new CgnService(api);
  
      const res = await service.getCgnStatus(mockedUser);
  
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
    mockStartCgnActivation.mockImplementation(() =>
      t.success({status: 201, headers: {Location: "/api/v1/cgn/activation"}, value: {
        id: {
          id: "AnInstanceId"
        }
      }})
    );

    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessRedirectToResource"
    });
  });

  it("should handle a success Accepted response", async () => {
    mockStartCgnActivation.mockImplementation(() =>
    t.success({status: 202})
  );

  const service = new CgnService(api);

  const res = await service.startCgnActivation(mockedUser);

  expect(res).toMatchObject({
    kind: "IResponseSuccessAccepted"
  });
});

  it("should handle an internal error when the client returns 401", async () => {
    mockStartCgnActivation.mockImplementation(() =>
      t.success({ status: 401 })
    );

    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a Forbidden error if the user is ineligible for a CGN", async () => {
    mockStartCgnActivation.mockImplementation(() =>
      t.success({ status: 403 })
    );

    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorForbiddenNotAuthorized"
    });
  });

  it("should handle a conflict error when the CGN is already activated", async () => {
    mockStartCgnActivation.mockImplementation(() =>
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
    mockStartCgnActivation.mockImplementation(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnService(api);

    const res = await service.startCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
      mockGetCgnStatus.mockImplementation(() =>
      t.success({ status: 123 })
    );
    const service = new CgnService(api);

    const res = await service.getCgnStatus(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
      mockGetCgnStatus.mockImplementation(() => {
      throw new Error();
    });
    const service = new CgnService(api);

    const res = await service.getCgnStatus(mockedUser);

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
    mockGetCgnActivation.mockImplementation(() =>
      t.success({status: 200})
    );

    const service = new CgnService(api);

    const res = await service.getCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the client returns 401", async () => {
    mockGetCgnActivation.mockImplementation(() =>
      t.success({ status: 401 })
    );

    const service = new CgnService(api);

    const res = await service.getCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a Not Found Error when no CGN activation infos are found", async () => {
    mockGetCgnActivation.mockImplementation(() =>
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
    mockGetCgnActivation.mockImplementation(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnService(api);

    const res = await service.getCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetCgnActivation.mockImplementation(() =>
      t.success({ status: 123 })
    );
    const service = new CgnService(api);

    const res = await service.getCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
      mockGetCgnStatus.mockImplementation(() => {
      throw new Error();
    });
    const service = new CgnService(api);

    const res = await service.getCgnActivation(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});