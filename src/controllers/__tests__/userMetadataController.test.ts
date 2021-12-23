/* tslint:disable:no-object-mutation */

import { left, right } from "fp-ts/lib/Either";
import * as redis from "redis";
import { UserMetadata } from "../../../generated/backend/UserMetadata";
import mockReq from "../../__mocks__/request";
import RedisUserMetadataStorage, {
  invalidVersionNumberError,
  metadataNotFoundError
} from "../../services/redisUserMetadataStorage";
import { mockedUser } from "../../__mocks__/user_mock";
import UserMetadataController from "../userMetadataController";

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
