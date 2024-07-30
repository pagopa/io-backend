import { SessionInfo } from "../../../generated/backend/SessionInfo";
import { SessionsList } from "../../../generated/backend/SessionsList";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import RedisSessionStorage from "../../services/redisSessionStorage";
import { mockedUser } from "../../__mocks__/user_mock";
import SessionController from "../sessionController";
import * as E from "fp-ts/lib/Either";
import { Second } from "@pagopa/ts-commons/lib/units";
import {
  mockExists,
  mockGet,
  mockRedisClientSelector,
  mockSmembers,
  mockSrem,
} from "../../__mocks__/redis";

const aDefaultLollipopAssertionRefDurationSec = (3600 * 24 * 365 * 2) as Second;
mockSmembers.mockImplementation((_) =>
  Promise.resolve([`SESSIONINFO-${mockedUser.session_token}`])
);

const controller = new SessionController(
  new RedisSessionStorage(
    mockRedisClientSelector,
    aDefaultLollipopAssertionRefDurationSec
  )
);

const res = mockRes();
const req = mockReq();

describe("SessionController#listSessions", () => {
  const expectedSessionInfo: SessionInfo = {
    createdAt: new Date(),
    sessionToken: mockedUser.session_token,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns list of sessions for an authenticated user", async () => {
    req.user = mockedUser;
    mockGet.mockImplementationOnce((_) =>
      Promise.resolve(JSON.stringify(expectedSessionInfo))
    );
    mockSrem.mockImplementationOnce((_, __) => Promise.resolve(true));
    mockExists.mockImplementationOnce((_) => Promise.reject());

    const response = await controller.listSessions(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(mockSrem).toBeCalledTimes(1);
    // smembers is called by clearExpiredSetValues and readSessionInfoKeys
    expect(mockSmembers).toBeCalledTimes(2);
    expect(mockSrem).toHaveBeenCalledWith(
      `USERSESSIONS-${mockedUser.fiscal_code}`,
      `SESSIONINFO-${mockedUser.session_token}`
    );
    const expectedResponse = SessionsList.decode({
      sessions: [expectedSessionInfo],
    });
    expect(E.isRight(expectedResponse)).toBeTruthy();
    if (E.isRight(expectedResponse)) {
      expect(res.json).toHaveBeenCalledWith(expectedResponse.right);
    }
  });
});
