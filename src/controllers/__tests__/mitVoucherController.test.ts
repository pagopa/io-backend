import mockReq from "../../__mocks__/request";
import { mockedUser } from "../../__mocks__/user_mock";
import TokenService from "../../services/tokenService";
import MitVoucherController from "../mitVoucherController";
import * as e from "express";
import { taskEither } from "fp-ts/lib/TaskEither";
import { fromLeft } from "fp-ts/lib/TaskEither";

const aMockedRequestWithRightParams = {
  ...mockReq(),
  user: mockedUser
} as e.Request;

const mockGetJwtMitVoucherToken = jest.fn();
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getJwtMitVoucherToken: mockGetJwtMitVoucherToken
    }))
  };
});

const aMitVoucherToken =
  "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MjM0MDA4MDQsImV4cCI6MTYyMzQwMTQwNCwiYXVkIjoiNjliM2Q1YTljOTM1ZmFjM2Q2MGMiLCJpc3MiOiJhcHAtYmFja2VuZC5pby5pdGFsaWEuaXQiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUEifQ.j1lMStlo7l7NQpCmcfKTbyP9Ly-MNdMi1PR1eis6JtX67OE8LsHXlW3DDUEAP55LjspWA8k8GqRdVqhX24fp7w";

describe("MitVoucherController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a valid Mit and with valid value", async () => {
    mockGetJwtMitVoucherToken.mockReturnValue(taskEither.of(aMitVoucherToken));

    const tokenService = new TokenService();
    const controller = new MitVoucherController(tokenService);
    const response = await controller.getMitVoucherToken(
      aMockedRequestWithRightParams
    );

    expect(response.kind).toEqual("IResponseSuccessJson");
    if (response.kind === "IResponseSuccessJson") {
      expect(response.value).toEqual({ token: aMitVoucherToken });
    }
  });

  it("should return an error if JWT generation fails", async () => {
    mockGetJwtMitVoucherToken.mockReturnValue(
      fromLeft(new Error("Cannot generate an empty Mit Voucher JWT Token"))
    );

    const tokenService = new TokenService();
    const controller = new MitVoucherController(tokenService);
    const response = await controller.getMitVoucherToken(
      aMockedRequestWithRightParams
    );

    // getUserDataProcessing is not called
    expect(response.kind).toEqual("IResponseErrorInternal");
    if (response.kind === "IResponseErrorInternal") {
      expect(response.detail).toEqual(
        "Internal server error: Cannot generate an empty Mit Voucher JWT Token"
      );
    }
  });
});
