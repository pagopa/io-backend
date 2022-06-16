import { BPDUser } from "../../../generated/bpd/BPDUser";
import { MyPortalUser } from "../../../generated/myportal/MyPortalUser";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { getUserForBPD, getUserForFIMS, getUserForMyPortal } from "../ssoController";
import { mockedInitializedProfile, mockedUser } from "../../__mocks__/user_mock";
import ProfileService from "../../services/profileService";
import { IApiClientFactoryInterface } from "../../services/IApiClientFactory";
import { ResponseErrorInternal, ResponseErrorTooManyRequests, ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { FIMSUser } from "../../../generated/fims/FIMSUser";
import { DateFromString } from "@pagopa/ts-commons/lib/dates";
import { ResponseErrorNotFound } from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/Either"
import { pipe } from "fp-ts/lib/function";

const myPortalUserResponse: MyPortalUser = {
  family_name: mockedUser.family_name,
  fiscal_code: mockedUser.fiscal_code,
  name: mockedUser.name
};

const bpdUserResponse: BPDUser = {
  family_name: mockedUser.family_name,
  fiscal_code: mockedUser.fiscal_code,
  name: mockedUser.name
};

const fimsUserResponse: FIMSUser = {
  acr: mockedUser.spid_level,
  auth_time: mockedUser.created_at,
  date_of_birth: pipe(mockedUser.date_of_birth, DateFromString.decode, E.getOrElseW(() => {
    fail("Invalid test initialization");
  })),
  email: mockedInitializedProfile.email,
  family_name: mockedUser.family_name,
  fiscal_code: mockedUser.fiscal_code,
  name: mockedUser.name
}
const req = mockReq();
const res = mockRes();

const mockGetProfile = jest.fn();
jest.mock("../../services/profileService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getProfile: mockGetProfile
    }))
  };
});

describe("SSOController#getUserForMyPortal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("calls the getUserForMyPortal on the SSOController with valid values", async () => {
    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const response = await getUserForMyPortal(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: myPortalUserResponse
    });
    response.apply(res);
    expect(res.json).toBeCalledWith(myPortalUserResponse);
  });

  it("calls the getUserForMyPortal on the SSOController with invalid user session", async () => {
    // An invalid user session data where the user name is missing
    const invalidUserSession = {
      ...mockedUser,
      name: undefined
    };

    // tslint:disable-next-line: no-object-mutation
    req.user = invalidUserSession;

    const response = await getUserForMyPortal(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: expect.any(String),
      kind: "IResponseErrorValidation"
    });
    response.apply(res);
    expect(res.status).toBeCalledWith(400);
  });
});

describe("SSOController#getUserForBPD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("calls the getUserForBPD on the SSOController with valid values", async () => {
    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const response = await getUserForBPD(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: bpdUserResponse
    });
    response.apply(res);
    expect(res.json).toBeCalledWith(bpdUserResponse);
  });
});

describe("SSOController#getUserForFIMS", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getUserForFIMS on the SSOController with valid values", async () => {
    mockGetProfile.mockImplementationOnce(() =>
      Promise.resolve(ResponseSuccessJson(mockedInitializedProfile))
    );
    const profileService = new ProfileService({} as IApiClientFactoryInterface)

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const response = await getUserForFIMS(profileService)(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: fimsUserResponse
    });
    response.apply(res);
    expect(res.json).toBeCalledWith(fimsUserResponse);
  });

  it.each`
  title                                                      | getProfile                                               | expected_kind                      | expected_status_code | expected_detail
  ${"return IResponseErrorNotFound if status is 404"}        | ${ResponseErrorNotFound("Not Found", "Missing profile")} | ${"IResponseErrorNotFound"}        | ${404}               | ${"Not Found: Missing profile"}
  ${"return IResponseErrorTooManyRequests if status is 429"} | ${ResponseErrorTooManyRequests()}                        | ${"IResponseErrorTooManyRequests"} | ${429}               | ${"Too many requests: "}
  ${"return IResponseErrorInternal if status is 500"}        | ${ResponseErrorInternal("Error Internal")}               | ${"IResponseErrorInternal"}        | ${500}               | ${"Internal server error: Error Internal"}
  `("should $title", async ({ getProfile, expected_kind, expected_detail, expected_status_code }) => {
    mockGetProfile.mockImplementationOnce(() =>
      Promise.resolve(getProfile)
    );
    const profileService = new ProfileService({} as IApiClientFactoryInterface)

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const response = await getUserForFIMS(profileService)(req);
    response.apply(res);
    expect(res.status).toHaveBeenCalledWith(expected_status_code);

    expect(response).toMatchObject({
      kind: expected_kind,
      detail: expected_detail
    });
  });
});
