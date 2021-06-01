import mockReq from "../../__mocks__/request";
import { aMockedUser } from "../../__mocks__/user_mock";
import { EUCovidCertAPIClient } from "../../clients/eucovidcert.client";
import EUCovidCertController from "../eucovidcertController";
import EUCovidCertService from "../../services/eucovidcertService";
import { StatusEnum as RevokedStatusEnum } from "@pagopa/io-functions-eucovidcerts-sdk/RevokedCertificate";
import * as e from "express";
import {
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import {
  ResponseErrorStatusNotDefinedInSpec,
  ResponseErrorUnexpectedAuthProblem
} from "../../utils/responses";

const API_KEY = "";
const API_URL = "";

const aMockedAuthCode = "000";

const aRevokedCertificate = {
  id: "000",
  revoke_reason: "bla bla bla",
  revoked_on: new Date("2018-10-13T00:00:00.000Z"),
  info: "Revoked Certificate",
  status: RevokedStatusEnum.revoked
};

const aMockedRequestWithRightParams = {
  ...mockReq(),
  user: aMockedUser,
  body: {
    accessData: { auth_code: aMockedAuthCode }
  }
} as e.Request;

const aMockedGetCertificate = jest.fn();
jest.mock("../../services/eucovidcertService", () => ({
  default: jest.fn().mockImplementation(_ => ({
    getEUCovidCertificate: aMockedGetCertificate
  }))
}));

const client = EUCovidCertAPIClient(API_KEY, API_URL);
const service = new EUCovidCertService(client);

describe("EUCovidCertificateController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const controller = new EUCovidCertController(service);
    await controller.getEUCovidCertificate(aMockedRequestWithRightParams);

    expect(aMockedGetCertificate).toHaveBeenCalledWith(
      aMockedUser,
      aMockedAuthCode
    );
  });

  it("should return IResponseSuccessJson if service return success", async () => {
    aMockedGetCertificate.mockReturnValue(
      ResponseSuccessJson(aRevokedCertificate)
    );

    const controller = new EUCovidCertController(service);
    const response = await controller.getEUCovidCertificate(
      aMockedRequestWithRightParams
    );

    expect(response).toEqual(
      expect.objectContaining({
        kind: "IResponseSuccessJson",
        value: aRevokedCertificate
      })
    );
  });

  it.each`
    title                                                            | fn                                                                       | expected_kind               | expected_detail
    ${"return IResponseErrorInternal"}                               | ${ResponseErrorUnexpectedAuthProblem}                                    | ${"IResponseErrorInternal"} | ${"Internal server error: Underlying API fails with an unexpected 401"}
    ${"return IResponseErrorNotFound"}                               | ${() => ResponseErrorNotFound("Not Found", "Certificate not found")}     | ${"IResponseErrorNotFound"} | ${"Not Found: Certificate not found"}
    ${"return IResponseErrorInternal"}                               | ${() => ResponseErrorInternal("")}                                       | ${"IResponseErrorInternal"} | ${"Internal server error: "}
    ${"return IResponseErrorInternal if status code is not in spec"} | ${() => ResponseErrorStatusNotDefinedInSpec({ status: "418" } as never)} | ${"IResponseErrorInternal"} | ${"Internal server error: unhandled API response status [418]"}
  `("should $title", async ({ fn, expected_kind, expected_detail }) => {
    aMockedGetCertificate.mockReturnValue(fn());

    const controller = new EUCovidCertController(service);
    const response = await controller.getEUCovidCertificate(
      aMockedRequestWithRightParams
    );

    expect(response).toEqual(
      expect.objectContaining({
        kind: expected_kind,
        detail: expected_detail
      })
    );
  });

  // Error handling ------

  it("should not make service call with empy user", async () => {
    const reqWithoutUser = {
      ...aMockedRequestWithRightParams,
      user: undefined
    } as e.Request;

    const controller = new EUCovidCertController(service);
    const response = await controller.getEUCovidCertificate(reqWithoutUser);

    expect(aMockedGetCertificate).not.toHaveBeenCalled();

    expect(response).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorValidation"
      })
    );
  });

  it("should not make service call with empty body params", async () => {
    const reqWithoutUser = {
      ...aMockedRequestWithRightParams,
      body: {}
    } as e.Request;

    const controller = new EUCovidCertController(service);
    const response = await controller.getEUCovidCertificate(reqWithoutUser);

    expect(aMockedGetCertificate).not.toHaveBeenCalled();
    expect(response).toEqual(
      expect.objectContaining({
        kind: "IResponseErrorValidation"
      })
    );
  });
});
