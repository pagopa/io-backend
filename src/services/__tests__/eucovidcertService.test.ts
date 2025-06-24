import * as e from "express";
import * as t from "io-ts";
import EUCovidCertService from "../eucovidcertService";
import { EUCovidCertAPIClient } from "../../clients/eucovidcert.client";
import { mockedUser } from "../../__mocks__/user_mock";
import { StatusEnum as RevokedStatusEnum } from "@pagopa/io-functions-eucovidcerts-sdk/RevokedCertificate";
import { RevokedCertificate } from "../../../generated/eucovidcert/RevokedCertificate";
import { ProblemJson } from "@pagopa/ts-commons/lib/responses";
import mockRes from "../../__mocks__/response";

const mockClientGetCertificate = jest.fn();

const client = ({
  getCertificate: mockClientGetCertificate
} as unknown) as ReturnType<EUCovidCertAPIClient>;

const aMockedAuthCode = "000";

const aRevokedCertificate: RevokedCertificate = {
  uvci: "000",
  header_info: {
    logo_id: "aLogoId",
    title: "a Title",
    subtitle: "a Subtitle"
  },
  info: "bla bla bla",
  revoked_on: new Date("2018-10-13T00:00:00.000Z"),
  status: RevokedStatusEnum.revoked
};

describe("EUCovidCertService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new EUCovidCertService(client);

    await service.getEUCovidCertificate(mockedUser, aMockedAuthCode);

    expect(mockClientGetCertificate).toHaveBeenCalledWith({
      accessData: {
        auth_code: aMockedAuthCode,
        fiscal_code: mockedUser.fiscal_code
      }
    });
  });

  it("should handle a success response", async () => {
    const service = new EUCovidCertService(client);

    mockClientGetCertificate.mockReturnValue(
      t.success({ status: 200, value: aRevokedCertificate })
    );

    const res = await service.getEUCovidCertificate(
      mockedUser,
      aMockedAuthCode
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aRevokedCertificate
    });
  });

  it.each`
    title                                                                | status_code | value                                                                                     | expected_status_code | expected_kind                 | expected_detail
    ${"return IResponseErrorValidation if status is 400"}                | ${400}      | ${null}                                                                                   | ${400}               | ${"IResponseErrorValidation"} | ${"Bad Request: Payload has bad format"}
    ${"return IResponseErrorInternal if status is 401"}                  | ${401}      | ${null}                                                                                   | ${500}               | ${"IResponseErrorInternal"}   | ${"Internal server error: Underlying API fails with an unexpected 401"}
    ${"return IResponseErrorNotFound if status is 403"}                  | ${403}      | ${null}                                                                                   | ${403}               | ${"IResponseErrorNotFound"}   | ${"Not Found: Access data provided are invalid or no Certificate has been emitted for the given Citizen"}
    ${"return IResponseErrorInternal if status is 500"}                  | ${500}      | ${{ title: "An error", detail: "An error detail", type: "An error type" } as ProblemJson} | ${500}               | ${"IResponseErrorInternal"}   | ${"Internal server error: An error (An error type)"}
    ${"return IResponseErrorInternal: Gateway Timeout if status is 504"} | ${504}      | ${null}                                                                                   | ${504}               | ${"IResponseErrorInternal"}   | ${"Gateway Timeout: DGC took to long to respond"}
    ${"return IResponseErrorInternal if status code is not in spec"}     | ${418}      | ${null}                                                                                   | ${500}               | ${"IResponseErrorInternal"}   | ${"Internal server error: unhandled API response status [418]"}
  `(
    "should $title",
    async ({
      status_code,
      value,
      expected_status_code,
      expected_kind,
      expected_detail
    }) => {
      mockClientGetCertificate.mockImplementation(() =>
        t.success({ status: status_code, value })
      );
      const service = new EUCovidCertService(client);

      const res = await service.getEUCovidCertificate(
        mockedUser,
        aMockedAuthCode
      );

      // Check status code
      const responseMock: e.Response = mockRes();
      res.apply(responseMock);
      expect(responseMock.status).toHaveBeenCalledWith(expected_status_code);

      expect(res).toMatchObject({
        kind: expected_kind,
        detail: expected_detail
      });
    }
  );
});
