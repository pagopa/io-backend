import * as t from "io-ts";
import EUCovidCertService from "../eucovidcertService";
import { EUCovidCertAPIClient } from "../../clients/eucovidcert.client";
import { aMockedUser } from "../../__mocks__/user_mock";
import { StatusEnum as RevokedStatusEnum } from "../../../generated/eucovidcert-api/RevokedCertificate";
import { RevokedCertificate } from "../../../generated/eucovidcert/RevokedCertificate";

const mockClientGetCertificate = jest.fn();

const client = {
  getCertificate: mockClientGetCertificate
} as ReturnType<EUCovidCertAPIClient>;

const aMockedAuthCode = "000";

const aRevokedCertificate: RevokedCertificate = {
  uvci: "000",
  revoke_info: "bla bla bla",
  revoked_on: new Date("2018-10-13T00:00:00.000Z"),
  status: RevokedStatusEnum.revoked
};

describe("EUCovidCertService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new EUCovidCertService(client);

    await service.getEUCovidCertificate(aMockedUser, aMockedAuthCode);

    expect(mockClientGetCertificate).toHaveBeenCalledWith({
      accessData: {
        auth_code: aMockedAuthCode,
        fiscal_code: aMockedUser.fiscal_code
      }
    });
  });

  it("should handle a success response", async () => {
    const service = new EUCovidCertService(client);

    mockClientGetCertificate.mockReturnValue(
      t.success({ status: 200, value: aRevokedCertificate })
    );

    const res = await service.getEUCovidCertificate(
      aMockedUser,
      aMockedAuthCode
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aRevokedCertificate
    });
  });

  it.each`
    title                                                            | status_code | expected_kind               | expected_detail
    ${"return IResponseErrorInternal"}                               | ${400}      | ${"IResponseErrorInternal"} | ${"Internal server error: Underlying API fails with an unexpected 401"}
    ${"return IResponseErrorInternal"}                               | ${401}      | ${"IResponseErrorInternal"} | ${"Internal server error: Underlying API fails with an unexpected 401"}
    ${"return IResponseErrorNotFound"}                               | ${403}      | ${"IResponseErrorNotFound"} | ${"Not Found: Certificate not found"}
    ${"return IResponseErrorInternal"}                               | ${500}      | ${"IResponseErrorInternal"} | ${"Internal server error: "}
    ${"return IResponseErrorInternal"}                               | ${504}      | ${"IResponseErrorInternal"} | ${"Internal server error: "}
    ${"return IResponseErrorInternal if status code is not in spec"} | ${418}      | ${"IResponseErrorInternal"} | ${"Internal server error: unhandled API response status [418]"}
  `(
    "should $title",
    async ({ status_code, expected_kind, expected_detail }) => {
      mockClientGetCertificate.mockImplementation(() =>
        t.success({ status: status_code })
      );
      const service = new EUCovidCertService(client);

      const res = await service.getEUCovidCertificate(
        aMockedUser,
        aMockedAuthCode
      );

      expect(res).toMatchObject({
        kind: expected_kind,
        detail: expected_detail
      });
    }
  );
});
