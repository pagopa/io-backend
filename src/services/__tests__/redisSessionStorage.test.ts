// tslint:disable:no-any

import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { User } from "../../types/user";
import MockedRedisClient from "../__mocks__/redisClient";
import RedisSessionStorage from "../redisSessionStorage";
import TokenService from "../tokenService";

const aTokenDuration = 3600;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;

// mock for a valid User
const mockedUser: User = {
  created_at: 1183518855,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: anEmailAddress,
  sessionIndex: "sessionIndex",
  spid_idp: "spid_idp_name",
  token: "HexToKen"
};

// authentication constant
const mockToken =
  "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b";
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getNewToken: jest.fn(() => {
        return mockToken;
      })
    }))
  };
});
const tokenService = new TokenService();

/**
 * Wait for all promises to finish.
 *
 * @returns {Promise<any>}
 */
function flushPromises<T>(): Promise<T> {
  return new Promise(resolve => setImmediate(resolve));
}

describe("sessionStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // test case: sessionStorage set storage works with valid values
  it("should set sessionStorage with valid values", async () => {
    const mockedRedisClient = new MockedRedisClient();

    const sessionStorage = new RedisSessionStorage(
      mockedRedisClient as any,
      aTokenDuration,
      tokenService
    );
    const spy = jest.spyOn(mockedRedisClient, "set");

    sessionStorage.set(mockedUser.token, mockedUser);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // test case: sessionStorage get inexistent key
  it("should fail getting a sessionStorage with inexistent values", async () => {
    const mockedRedisClient = new MockedRedisClient();

    const sessionStorage = new RedisSessionStorage(
      mockedRedisClient as any,
      aTokenDuration,
      tokenService
    );
    const spy = jest.spyOn(mockedRedisClient, "get");

    const getValue = sessionStorage.get("notSetValue");

    await flushPromises();

    getValue.catch(val => {
      expect(val).toBeDefined();
      expect(val._tag).toBe("Left");
      expect(val.value).toEqual(new Error("Session not found"));
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // test case: sessionStorage set and get storage fail with invalid values
  it("should set and get a sessionStorage with invalid values", async () => {
    const mockedRedisClient = new MockedRedisClient();

    const sessionStorage = new RedisSessionStorage(
      mockedRedisClient as any,
      aTokenDuration,
      tokenService
    );
    const spy = jest.spyOn(mockedRedisClient, "get");

    const invalidFiscalCodeUser: User = mockedUser;
    invalidFiscalCodeUser.fiscal_code = "INVALID-FC" as any;

    sessionStorage.set(invalidFiscalCodeUser.token, invalidFiscalCodeUser);

    const getValue = sessionStorage.get(mockedUser.token);

    await flushPromises();

    // tslint:disable-next-line:no-identical-functions
    getValue.catch(val => {
      expect(val).toBeDefined();
      expect(val._tag).toBe("Left");
      expect(val.value).toEqual(new Error("Session not found"));
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // test case: sessionStorage set and get storage works with valid values
  it("should set and get a sessionStorage with valid values", async () => {
    const mockedRedisClient = new MockedRedisClient();

    const sessionStorage = new RedisSessionStorage(
      mockedRedisClient as any,
      aTokenDuration,
      tokenService
    );
    const spy = jest.spyOn(mockedRedisClient, "get");

    sessionStorage.set(mockedUser.token, mockedUser);

    const getValue = sessionStorage.get(mockedUser.token);

    await flushPromises();

    getValue.catch(val => {
      expect(val).toBeDefined();
      expect(val._tag).toBe("Right");
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // test case: sessionStorage del storage works with valid values
  it("should delete sessionStorage with valid values", async () => {
    const mockedRedisClient = new MockedRedisClient();

    const sessionStorage = new RedisSessionStorage(
      mockedRedisClient as any,
      aTokenDuration,
      tokenService
    );

    const spy = jest.spyOn(mockedRedisClient, "hdel");

    sessionStorage.del(mockedUser.token);

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
