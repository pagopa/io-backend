/* tslint:disable:no-object-mutation */

import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { left, right } from "fp-ts/lib/Either";
import * as redis from "redis";
import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { UserMetadata } from "../../../generated/backend/UserMetadata";
import mockReq from "../../__mocks__/request";
import RedisUserMetadataStorage, {
  invalidVersionNumberError,
  metadataNotFoundError
} from "../../services/redisUserMetadataStorage";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import UserMetadataController from "../userMetadataController";

const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "123hexToken" as WalletToken
};

const mockMetadata: UserMetadata = {
  metadata: "TEST-METADATA-GENERIC-STRING",
  version: 1
};

const mockGetMetadata = jest.fn();
const mockUpsertMetadata = jest.fn();
jest.mock("../../services/redisUserMetadataStorage", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      get: mockGetMetadata,
      set: mockUpsertMetadata
    })),
    invalidVersionNumberError: new Error("Invalid Version Number"),
    metadataNotFoundError: new Error("Metadata not found")
  };
});

describe("UserMetadataController#getMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getMetadata on the UserMetadataController with valid values", async () => {
    const req = mockReq();

    mockGetMetadata.mockReturnValue(Promise.resolve(right(mockMetadata)));

    req.user = mockedUser;
    const redisClient = {} as redis.RedisClient;

    const userMetadataService = new RedisUserMetadataStorage(redisClient);
    const controller = new UserMetadataController(userMetadataService);

    const response = await controller.getMetadata(req);

    expect(mockGetMetadata).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: mockMetadata
    });
  });

  it("calls the getMetadata on the UserMetadataController with empty metadata", async () => {
    const req = mockReq();

    mockGetMetadata.mockReturnValue(
      Promise.resolve(left(metadataNotFoundError))
    );

    req.user = mockedUser;
    const redisClient = {} as redis.RedisClient;

    const userMetadataService = new RedisUserMetadataStorage(redisClient);
    const controller = new UserMetadataController(userMetadataService);

    const response = await controller.getMetadata(req);

    expect(mockGetMetadata).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseNoContent",
      value: {}
    });
  });

  it("calls the getMetadata on the UserMetadataController with a redis error", async () => {
    const req = mockReq();

    const redisError = new Error("Redis Error");
    mockGetMetadata.mockReturnValue(Promise.resolve(left(redisError)));

    req.user = mockedUser;
    const redisClient = {} as redis.RedisClient;

    const userMetadataService = new RedisUserMetadataStorage(redisClient);
    const controller = new UserMetadataController(userMetadataService);

    const response = await controller.getMetadata(req);

    expect(mockGetMetadata).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: `Internal server error: ${redisError.message}`,
      kind: "IResponseErrorInternal"
    });
  });
});

describe("UserMetadataController#upsertMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the upsertMetadata on the UserMetadataController with valid values", async () => {
    const req = mockReq();

    mockUpsertMetadata.mockReturnValue(Promise.resolve(right(true)));

    req.user = mockedUser;
    req.body = mockMetadata;

    const redisClient = {} as redis.RedisClient;

    const userMetadataService = new RedisUserMetadataStorage(redisClient);
    const controller = new UserMetadataController(userMetadataService);

    const response = await controller.upsertMetadata(req);

    expect(mockUpsertMetadata).toHaveBeenCalledWith(mockedUser, mockMetadata);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: mockMetadata
    });
  });

  it("calls the upsertMetadata on the UserMetadataController with valid values", async () => {
    const req = mockReq();
    const redisError = new Error("Redis Error");

    mockUpsertMetadata.mockReturnValue(Promise.resolve(left(redisError)));

    req.user = mockedUser;
    req.body = mockMetadata;

    const redisClient = {} as redis.RedisClient;

    const userMetadataService = new RedisUserMetadataStorage(redisClient);
    const controller = new UserMetadataController(userMetadataService);

    const response = await controller.upsertMetadata(req);

    expect(mockUpsertMetadata).toHaveBeenCalledWith(mockedUser, mockMetadata);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: `Internal server error: ${redisError.message}`,
      kind: "IResponseErrorInternal"
    });
  });

  it("calls the upsertMetadata on the UserMetadataController with invalid version number", async () => {
    const req = mockReq();

    mockUpsertMetadata.mockReturnValue(
      Promise.resolve(left(invalidVersionNumberError))
    );

    req.user = mockedUser;
    req.body = mockMetadata;

    const redisClient = {} as redis.RedisClient;

    const userMetadataService = new RedisUserMetadataStorage(redisClient);
    const controller = new UserMetadataController(userMetadataService);

    const response = await controller.upsertMetadata(req);

    expect(mockUpsertMetadata).toHaveBeenCalledWith(mockedUser, mockMetadata);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: `Conflict: ${invalidVersionNumberError.message}`,
      kind: "IResponseErrorConflict"
    });
  });
});
