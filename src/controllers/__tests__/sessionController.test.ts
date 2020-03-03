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
const allowMultipleSessions = false;
const aTokenDurationSecs = 3600;
const mockGet = jest.fn();
const mockMget = jest.fn();
const mockSmembers = jest.fn();
const mockRedisClient = createMockRedis().createClient();
mockRedisClient.get = mockGet;
mockRedisClient.mget = mockMget;
mockRedisClient.smembers = mockSmembers;
const controller = new SessionController(
  new RedisSessionStorage(
    mockRedisClient,
    aTokenDurationSecs,
    allowMultipleSessions
  )
);

const res = mockRes();
const req = mockReq();

describe("SessionController#getSessionState", () => {
  it("returns correct session state for valid session", async () => {
    req.user = mockedUser;

    const response = await controller.getSessionState(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      spidLevel: "https://www.spid.gov.it/SpidL2",
      walletToken: mockedUser.wallet_token
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
      callback(null, [
        `USER-${mockedUser.fiscal_code}-SESSION-${mockedUser.session_token}`
      ]);
    });
    mockMget.mockImplementationOnce((_, callback) => {
      callback(null, [JSON.stringify(expectedSessionInfo)]);
    });
  });
  it("returns list of sessions for an authenticated user", async () => {
    req.user = mockedUser;

    const response = await controller.listSessions(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    const expectedResponse = SessionsList.decode({
      sessions: [expectedSessionInfo]
    });
    expect(res.json).toHaveBeenCalledWith(expectedResponse.value);
  });
});
