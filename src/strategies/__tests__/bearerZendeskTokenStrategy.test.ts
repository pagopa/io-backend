import { mockedUser, mockZendeskToken } from "../../__mocks__/user_mock";
import RedisSessionStorage from "../../services/redisSessionStorage";
import * as passport from "passport";
import bearerZendeskTokenStrategy from "../bearerZendeskTokenStrategy";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { ZendeskToken } from "../../types/token";
import { Second } from "@pagopa/ts-commons/lib/units";
import { RedisClient } from "redis";

const aTokenDurationSecs = 3600;
const aDefaultLollipopAssertionRefDurationSec = (3600 * 24 * 365 * 2) as Second;
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockMget = jest.fn();
const mockSmembers = jest.fn();
const mockSismember = jest.fn();
const mockSrem = jest.fn();
const mockTtl = jest.fn();
const mockRedisClient = {} as RedisClient;
mockRedisClient.get = mockGet;
mockRedisClient.mget = mockMget;
mockRedisClient.smembers = mockSmembers.mockImplementation((_, callback) => {
  callback(null, [`SESSIONINFO-${mockedUser.session_token}`]);
});
mockRedisClient.sismember = mockSismember;
mockRedisClient.ttl = mockTtl;
mockRedisClient.set = mockSet;
mockRedisClient.srem = mockSrem;

const aValidOldTransitorySessionZendeskToken = mockZendeskToken;
const aValidZendeskToken = mockZendeskToken + "1234abcd";

const mockedRedisMemory = {
  [mockZendeskToken]: mockedUser
};

const errorMessage = "User not found";

jest.mock("../../services/redisSessionStorage", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getByZendeskToken: jest
        .fn()
        .mockImplementation(async (token: ZendeskToken) =>
          mockedRedisMemory[token]
            ? E.right(O.some(mockedRedisMemory[token]))
            : E.left(errorMessage)
        )
    }))
  };
});

const sessionService = new RedisSessionStorage(
  mockRedisClient,
  aTokenDurationSecs,
  aDefaultLollipopAssertionRefDurationSec
);

const res = mockRes();
const req = mockReq();

describe("bearerZendeskTokenStrategy", function() {
  it("should correctly find the user to login with a valid zendeskToken of 48 bytes", done => {
    req.body = { user_token: aValidOldTransitorySessionZendeskToken };

    passport.use("bearer.zendesk", bearerZendeskTokenStrategy(sessionService));
    passport.authenticate(
      "bearer.zendesk",
      {
        session: false
      },
      // this is the "done" function of the strategy
      (error: any, user: any, options: any) => {
        expect(error).toEqual(null);
        expect(user).toEqual(mockedUser);
        expect(options).toEqual("");
        done();
      }
    )(req, res);
  });

  it("should correctly find the user to login with a new valid zendeskToken greater than 48 bytes", done => {
    req.body = { user_token: aValidZendeskToken };

    passport.use("bearer.zendesk", bearerZendeskTokenStrategy(sessionService));
    passport.authenticate(
      "bearer.zendesk",
      {
        session: false
      },
      // this is the "done" function of the strategy
      (error: any, user: any, options: any) => {
        expect(error).toEqual(null);
        expect(user).toEqual(mockedUser);
        expect(options).toEqual("");
        done();
      }
    )(req, res);
  });

  it("should fail to find the user to login with an invalid zendeskToken", done => {
    req.body = { user_token: "notexists" };

    passport.use("bearer.zendesk", bearerZendeskTokenStrategy(sessionService));
    passport.authenticate(
      "bearer.zendesk",
      {
        session: false
      },
      // this is the "done" function of the strategy
      (error: any, user: any, options: any) => {
        expect(error).toEqual(errorMessage);
        expect(user).toEqual(undefined);
        expect(options).toEqual(undefined);
        done();
      }
    )(req, res);
  });
});
