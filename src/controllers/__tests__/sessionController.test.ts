import { createMockRedis } from "mock-redis-client";
import { SessionInfo } from "../../../generated/backend/SessionInfo";
import { SessionsList } from "../../../generated/backend/SessionsList";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import RedisSessionStorage from "../../services/redisSessionStorage";
import TokenService from "../../services/tokenService";
import {
  mockedUser,
  mockWalletToken,
  mockMyPortalToken,
  mockBPDToken,
  mockZendeskToken,
  mockFIMSToken,
  mockedInitializedProfile
} from "../../__mocks__/user_mock";
import SessionController from "../sessionController";
import * as E from "fp-ts/lib/Either";
import { User } from "../../types/user";
import ApiClient from "../../services/apiClientFactory";
import ProfileService from "../../services/profileService";
import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import * as crypto from "crypto";
import { Second } from "@pagopa/ts-commons/lib/units";

const aTokenDurationSecs = 3600;
const aDefaultLollipopAssertionRefDurationSec = (3600 * 24 * 365 * 2) as Second;
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
mockRedisClient.smembers = mockSmembers.mockImplementation((_, callback) => {
  callback(null, [`SESSIONINFO-${mockedUser.session_token}`]);
});
mockRedisClient.sismember = mockSismember;
mockRedisClient.ttl = mockTtl;
mockRedisClient.set = mockSet;
mockRedisClient.srem = mockSrem;

const mockGetProfile = jest.fn();
jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getProfile: mockGetProfile
    }))
  };
});

mockGetProfile.mockReturnValue(
  Promise.resolve(ResponseSuccessJson(mockedInitializedProfile))
);

const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
const profileService = new ProfileService(apiClient);

const tokenService = new TokenService();
const mockGetNewToken = jest.spyOn(tokenService, "getNewToken");

const controller = new SessionController(
  new RedisSessionStorage(
    mockRedisClient,
    aTokenDurationSecs,
    aDefaultLollipopAssertionRefDurationSec
  ),
  tokenService,
  profileService
);

const zendeskSuffixForCorrectlyRetrievedProfile = crypto
  .createHash("sha256")
  .update(mockedInitializedProfile.email!)
  .digest("hex")
  .substring(0, 8);

const res = mockRes();
const req = mockReq();

describe("SessionController#getSessionState", () => {
  it("returns correct session state for valid session", async () => {
    req.user = {
      ...mockedUser,
      bpd_token: mockBPDToken,
      fims_token: mockFIMSToken,
      myportal_token: mockMyPortalToken,
      zendesk_token: mockZendeskToken
    };

    const response = await controller.getSessionState(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      bpdToken: mockBPDToken,
      fimsToken: mockFIMSToken,
      myPortalToken: mockMyPortalToken,
      spidLevel: "https://www.spid.gov.it/SpidL2",
      walletToken: mockedUser.wallet_token,
      zendeskToken: mockZendeskToken + zendeskSuffixForCorrectlyRetrievedProfile
    });
  });

  it("create new tokens if missing for current session", async () => {
    req.user = req.user = {
      ...mockedUser,
      bpd_token: undefined,
      fims_token: undefined,
      myportal_token: undefined,
      zendesk_token: undefined
    } as User;

    mockGetNewToken.mockImplementationOnce(() => mockBPDToken);
    mockGetNewToken.mockImplementationOnce(() => mockFIMSToken);
    mockGetNewToken.mockImplementationOnce(() => mockMyPortalToken);
    mockGetNewToken.mockImplementationOnce(() => mockZendeskToken);

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
    expect(mockGetNewToken).toBeCalledTimes(4);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      bpdToken: mockBPDToken,
      fimsToken: mockFIMSToken,
      myPortalToken: mockMyPortalToken,
      spidLevel: "https://www.spid.gov.it/SpidL2",
      walletToken: mockWalletToken,
      zendeskToken: mockZendeskToken + zendeskSuffixForCorrectlyRetrievedProfile
    });
  });

  it("returns correct session state for valid session with errors in retrieving profile", async () => {
    mockGetProfile.mockImplementationOnce(() => {
      throw "error";
    });

    req.user = {
      ...mockedUser,
      bpd_token: mockBPDToken,
      fims_token: mockFIMSToken,
      myportal_token: mockMyPortalToken,
      zendesk_token: mockZendeskToken
    };

    const response = await controller.getSessionState(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      bpdToken: mockBPDToken,
      fimsToken: mockFIMSToken,
      myPortalToken: mockMyPortalToken,
      spidLevel: "https://www.spid.gov.it/SpidL2",
      walletToken: mockedUser.wallet_token,
      zendeskToken: expect.stringContaining(mockZendeskToken)
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
    mockMget.mockImplementationOnce((_, callback) => {
      callback(null, [JSON.stringify(expectedSessionInfo)]);
    });
  });

  it("returns list of sessions for an authenticated user", async () => {
    req.user = mockedUser;
    mockSrem.mockImplementationOnce((_, __, callback) =>
      callback(undefined, true)
    );

    const response = await controller.listSessions(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockSrem).toBeCalledTimes(1);
    // smembers is called by clearExpiredSetValues and readSessionInfoKeys
    expect(mockSmembers).toBeCalledTimes(2);
    expect(mockSrem.mock.calls[0][0]).toEqual(
      `USERSESSIONS-${mockedUser.fiscal_code}`
    );
    expect(mockSrem.mock.calls[0][1]).toEqual(
      `SESSIONINFO-${mockedUser.session_token}`
    );
    const expectedResponse = SessionsList.decode({
      sessions: [expectedSessionInfo]
    });
    expect(E.isRight(expectedResponse)).toBeTruthy();
    if (E.isRight(expectedResponse)) {
      expect(res.json).toHaveBeenCalledWith(expectedResponse.right);
    }
  });
});
