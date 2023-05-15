import * as redis from "redis";

import { PagoPAUser } from "../../../generated/pagopa/PagoPAUser";

import mockReq from "../../__mocks__/request";

import * as E from "fp-ts/lib/Either";
import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import ApiClientFactory from "../../services/apiClientFactory";
import ProfileService from "../../services/profileService";
import RedisSessionStorage from "../../services/redisSessionStorage";
import { User } from "../../types/user";
import PagoPAController from "../pagoPAController";
import {
  aCustomEmailAddress,
  mockedInitializedProfile,
  mockedUser
} from "../../__mocks__/user_mock";
import { Second } from "@pagopa/ts-commons/lib/units";

const proxyUserResponse: PagoPAUser = {
  family_name: mockedUser.family_name,
  fiscal_code: mockedUser.fiscal_code,
  name: mockedUser.name,
  notice_email: aCustomEmailAddress,
  spid_email: mockedUser.spid_email
};

const mockGetPagoPaNoticeEmail = jest
  .fn()
  .mockImplementation((_, __) =>
    Promise.resolve(E.left(new Error("Notify email value not found")))
  );

const mockSetPagoPaNoticeEmail = jest
  .fn()
  .mockImplementation(_ => Promise.resolve(E.right(true)));

jest.mock("../../services/redisSessionStorage", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getPagoPaNoticeEmail: mockGetPagoPaNoticeEmail,
      setPagoPaNoticeEmail: mockSetPagoPaNoticeEmail
    }))
  };
});

const mockGetProfile = jest.fn();
jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getProfile: mockGetProfile
    }))
  };
});

const redisClient = {} as redis.RedisClientType;

const tokenDurationSecs = 0;
const aDefaultLollipopAssertionRefDurationSec = (3600 * 24 * 365 * 2) as Second;
const redisSessionStorage = new RedisSessionStorage(
  redisClient,
  tokenDurationSecs,
  aDefaultLollipopAssertionRefDurationSec
);

describe("PagoPaController#getUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a successful response with validated email", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockedInitializedProfile))
    );

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const apiClient = new ApiClientFactory("", "");
    const profileService = new ProfileService(apiClient);
    const pagoPAController = new PagoPAController(
      profileService,
      redisSessionStorage,
      true
    );

    const response = await pagoPAController.getUser(req);
    expect(mockGetPagoPaNoticeEmail).toBeCalledWith(mockedUser);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockSetPagoPaNoticeEmail).toBeCalledWith(
      mockedUser,
      mockedInitializedProfile.email
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyUserResponse
    });
  });

  it("should return a successful response with notice-email cache disabled", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockedInitializedProfile))
    );

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const apiClient = new ApiClientFactory("", "");
    const profileService = new ProfileService(apiClient);
    const pagoPAController = new PagoPAController(
      profileService,
      redisSessionStorage,
      false
    );

    const response = await pagoPAController.getUser(req);
    expect(mockGetPagoPaNoticeEmail).not.toBeCalled();
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(mockSetPagoPaNoticeEmail).toBeCalledWith(
      mockedUser,
      mockedInitializedProfile.email
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyUserResponse
    });
  });

  it("should return a successful response with cached notice email", async () => {
    const req = mockReq();

    mockGetPagoPaNoticeEmail.mockImplementationOnce(() =>
      Promise.resolve(E.right(aCustomEmailAddress))
    );

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const apiClient = new ApiClientFactory("", "");
    const profileService = new ProfileService(apiClient);
    const pagoPAController = new PagoPAController(
      profileService,
      redisSessionStorage,
      true
    );

    const response = await pagoPAController.getUser(req);
    expect(mockGetProfile).not.toBeCalled();
    expect(mockGetPagoPaNoticeEmail).toBeCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyUserResponse
    });
  });

  it("should return a successful response with notice_email equals to spid_email when user email is unverified", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(
        // Return an InitializedProfile with non validated email
        ResponseSuccessJson({
          ...mockedInitializedProfile,
          is_email_validated: false
        })
      )
    );

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const apiClient = new ApiClientFactory("", "");
    const profileService = new ProfileService(apiClient);
    const pagoPAController = new PagoPAController(
      profileService,
      redisSessionStorage,
      true
    );

    const response = await pagoPAController.getUser(req);
    expect(mockGetProfile).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      // Custom Email is not provided becouse not yet validated
      value: {
        ...proxyUserResponse,
        notice_email: mockedUser.spid_email
      }
    });
  });

  it("should return a validation error response when user email is not verified and spid_email is not available", async () => {
    const req = mockReq();

    mockGetProfile.mockReturnValue(
      Promise.resolve(
        // Return an InitializedProfile with non validated email
        ResponseSuccessJson({
          ...mockedInitializedProfile,
          is_email_validated: false
        })
      )
    );

    // A session user info without spid email available
    const notSpidUserSessionUser: User = {
      ...mockedUser,
      spid_email: undefined
    };
    // tslint:disable-next-line: no-object-mutation
    req.user = notSpidUserSessionUser;

    const apiClient = new ApiClientFactory("", "");
    const profileService = new ProfileService(apiClient);
    const pagoPAController = new PagoPAController(
      profileService,
      redisSessionStorage,
      true
    );

    const response = await pagoPAController.getUser(req);
    expect(mockGetProfile).toHaveBeenCalledWith(notSpidUserSessionUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: "Validation Error: Invalid User Data",
      kind: "IResponseErrorValidation"
    });
  });
});
