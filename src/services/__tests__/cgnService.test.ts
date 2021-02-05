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

const mockCgnAPIClient = {
  getCgnStatus: mockGetCgnStatus,
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

    it("should handle a not found error when the client returns 401", async () => {
        mockGetCgnStatus.mockImplementation(() =>
        t.success({ status: 401 })
      );
  
      const service = new CgnService(api);
  
      const res = await service.getCgnStatus(mockedUser);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorForbiddenNotAuthorized"
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