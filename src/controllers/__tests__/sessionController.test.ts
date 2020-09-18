/* tslint:disable:no-any */
/* tslint:disable:no-duplicate-string */
/* tslint:disable:no-let */
/* tslint:disable:no-identical-functions */
/* tslint:disable:no-big-function */
/* tslint:disable:no-object-mutation */

import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { createMockRedis } from "mock-redis-client";
import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SessionInfo } from "../../../generated/backend/SessionInfo";
import { SessionsList } from "../../../generated/backend/SessionsList";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import RedisSessionStorage from "../../services/redisSessionStorage";
import TokenService from "../../services/tokenService";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import SessionController from "../sessionController";

// user constant
const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidname = "Giuseppe Maria";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// authentication constant
const mockSessionToken =
  "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b";
const mockWalletToken =
  "5ba5b99a982da1aa5eb4fd8643124474fa17ee3016c13c617ab79d2e7c8624bb80105c0c0cae9864e035a0d31a715043";
const mockMyPortalToken = "c4d6bc16ef30211fb3fa8855efecac21be04a7d032f8700d";
const mockBPDToken = "4123ee213b64955212ea59e3beeaad1e5fdb3a36d2210416";

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: aValidname,
  session_token: mockSessionToken as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: mockWalletToken as WalletToken
};

const aTokenDurationSecs = 3600;
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockMget = jest.fn();
const mockSmembers = jest.fn();
const mockSismember = jest.fn();
const mockSrem = jest.fn();
const mockTtl = jest.fn();
const mockRedisClient = createMockRedis().createClient();
mockRedisClient.get = mockGet;
mockRedisClient.mget = mockMget;
mockRedisClient.smembers = mockSmembers;
mockRedisClient.sismember = mockSismember;
mockRedisClient.ttl = mockTtl;
mockRedisClient.set = mockSet;
mockRedisClient.srem = mockSrem;

const tokenService = new TokenService();
const mockGetNewToken = jest.spyOn(tokenService, "getNewToken");

const controller = new SessionController(
  new RedisSessionStorage(mockRedisClient, aTokenDurationSecs),
  tokenService
);

const res = mockRes();
const req = mockReq();

describe("SessionController#getSessionState", () => {
  it("returns correct session state for valid session", async () => {
    req.user = {
      ...mockedUser,
      bpd_token: mockBPDToken,
      myportal_token: mockMyPortalToken
    };

    const response = await controller.getSessionState(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      bpdToken: mockBPDToken,
      myPortalToken: mockMyPortalToken,
      spidLevel: "https://www.spid.gov.it/SpidL2",
      walletToken: mockedUser.wallet_token
    });
  });
  it("create a new myportal_token if missing for current session", async () => {
    req.user = mockedUser;

    mockGetNewToken.mockImplementationOnce(() => mockMyPortalToken);
    mockGetNewToken.mockImplementationOnce(() => mockBPDToken);

    mockTtl.mockImplementationOnce((_, callback) => callback(undefined, 2000));
    mockSet.mockImplementationOnce((_, __, ___, ____, callback) =>
      callback(undefined, "OK")
    );
    mockSet.mockImplementationOnce((_, __, ___, ____, callback) =>
      callback(undefined, "OK")
    );
    mockSet.mockImplementationOnce((_, __, ___, ____, callback) =>
      callback(undefined, "OK")
    );
    mockSet.mockImplementationOnce((_, __, ___, ____, callback) =>
      callback(undefined, "OK")
    );
    mockSmembers.mockImplementationOnce((_, callback) =>
      callback(undefined, [])
    );

    const response = await controller.getSessionState(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockGetNewToken).toBeCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      bpdToken: mockBPDToken,
      myPortalToken: mockMyPortalToken,
      spidLevel: "https://www.spid.gov.it/SpidL2",
      walletToken: mockWalletToken
    });
  });
});

describe("SessionController#listSessions", () => {
  const expectedSessionInfo: SessionInfo = {
    createdAt: new Date(),
    sessionToken: mockedUser.session_token
  };
  beforeEach(() => {
    jest.clearAllMocks();
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(null, [`SESSIONINFO-${mockedUser.session_token}`]);
    });
    mockMget.mockImplementationOnce((_, callback) => {
      callback(null, [JSON.stringify(expectedSessionInfo)]);
    });
  });
  it("returns list of sessions for an authenticated user", async () => {
    req.user = mockedUser;
    mockSmembers.mockImplementationOnce((_, callback) => {
      callback(null, [`SESSIONINFO-${mockedUser.session_token}`]);
    });
    mockSrem.mockImplementationOnce((_, __, callback) =>
      callback(undefined, true)
    );

    const response = await controller.listSessions(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockSrem).toBeCalledTimes(1);
    expect(mockSrem.mock.calls[0][0]).toEqual(
      `USERSESSIONS-${mockedUser.fiscal_code}`
    );
    expect(mockSrem.mock.calls[0][1]).toEqual(
      `SESSIONINFO-${mockedUser.session_token}`
    );
    const expectedResponse = SessionsList.decode({
      sessions: [expectedSessionInfo]
    });
    expect(res.json).toHaveBeenCalledWith(expectedResponse.value);
  });
});
