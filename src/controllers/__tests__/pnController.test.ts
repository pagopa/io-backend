import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { right, left } from "fp-ts/lib/Either";
import { PNActivation } from "../../../generated/api_piattaforma-notifiche-courtesy/PNActivation";
import { IoCourtesyDigitalAddressActivation } from "../../../generated/piattaforma-notifiche-courtesy/IoCourtesyDigitalAddressActivation";
import { PNEnvironment } from "../../clients/pn-clients";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { mockedUser } from "../../__mocks__/user_mock";
import { upsertPNActivationController } from "../pnController";

const successUpsertPnActivation = Promise.resolve(
  right<never, IResponseType<204, undefined, never>>({
    headers: {},
    status: 204,
    value: undefined
  })
);
const failUpsertPnActivation = Promise.reject(new Error("error"));
const badRequestUpsertPnActivation = Promise.resolve(
  right<never, IResponseType<400, undefined, never>>({
    headers: {},
    status: 400,
    value: undefined
  })
);
const invalidResponseUpsertPnActivation = Promise.resolve(
  left(new Error("Error"))
);
const unexpectedUpsertPnActivation = Promise.resolve(
  right<never, IResponseType<599, undefined, never>>({
    headers: {},
    status: 599,
    value: undefined
  })
);

const res = mockRes();
const req = mockReq();
req.user = mockedUser;

describe("pnController#upsertPNActivationController", () => {
  it.each`
    case                                             | environment                 | isTestValue  | pnServiceResponse                    | responseKind
    ${"when service success"}                        | ${PNEnvironment.PRODUCTION} | ${undefined} | ${successUpsertPnActivation}         | ${"IResponseNoContent"}
    ${"when service success"}                        | ${PNEnvironment.UAT}        | ${true}      | ${successUpsertPnActivation}         | ${"IResponseNoContent"}
    ${"when service success"}                        | ${PNEnvironment.PRODUCTION} | ${false}     | ${successUpsertPnActivation}         | ${"IResponseNoContent"}
    ${"when service fail"}                           | ${PNEnvironment.PRODUCTION} | ${undefined} | ${failUpsertPnActivation}            | ${"IResponseErrorInternal"}
    ${"when service fail"}                           | ${PNEnvironment.UAT}        | ${true}      | ${failUpsertPnActivation}            | ${"IResponseErrorInternal"}
    ${"when service fail"}                           | ${PNEnvironment.PRODUCTION} | ${false}     | ${failUpsertPnActivation}            | ${"IResponseErrorInternal"}
    ${"when service returns bad request"}            | ${PNEnvironment.PRODUCTION} | ${undefined} | ${badRequestUpsertPnActivation}      | ${"IResponseErrorInternal"}
    ${"when service returns bad request"}            | ${PNEnvironment.UAT}        | ${true}      | ${badRequestUpsertPnActivation}      | ${"IResponseErrorInternal"}
    ${"when service returns bad request"}            | ${PNEnvironment.PRODUCTION} | ${false}     | ${badRequestUpsertPnActivation}      | ${"IResponseErrorInternal"}
    ${"when service returns validation error"}       | ${PNEnvironment.PRODUCTION} | ${undefined} | ${invalidResponseUpsertPnActivation} | ${"IResponseErrorInternal"}
    ${"when service returns validation error"}       | ${PNEnvironment.UAT}        | ${true}      | ${invalidResponseUpsertPnActivation} | ${"IResponseErrorInternal"}
    ${"when service returns validation error"}       | ${PNEnvironment.PRODUCTION} | ${false}     | ${invalidResponseUpsertPnActivation} | ${"IResponseErrorInternal"}
    ${"when service returns unexpected status code"} | ${PNEnvironment.PRODUCTION} | ${undefined} | ${unexpectedUpsertPnActivation}      | ${"IResponseErrorInternal"}
    ${"when service returns unexpected status code"} | ${PNEnvironment.UAT}        | ${true}      | ${unexpectedUpsertPnActivation}      | ${"IResponseErrorInternal"}
    ${"when service returns unexpected status code"} | ${PNEnvironment.PRODUCTION} | ${false}     | ${unexpectedUpsertPnActivation}      | ${"IResponseErrorInternal"}
  `(
    "should returns a $responseKind $case on $environment environment with isTest=$isTestValue",
    async ({
      environment,
      isTestValue,
      pnServiceResponse,
      responseKind
    }: {
      environment: PNEnvironment;
      isTestValue: boolean | undefined;
      pnServiceResponse: any;
      responseKind: string;
    }) => {
      const mockUpsertPnActivation = jest.fn(
        (
          _: PNEnvironment,
          __: FiscalCode,
          ___: IoCourtesyDigitalAddressActivation
        ) => pnServiceResponse
      );
      const controller = upsertPNActivationController(mockUpsertPnActivation);
      req.body = {
        activation_status: true
      } as PNActivation;
      req.query = {
        isTest: isTestValue
      };
      const response = await controller(req);
      response.apply(res);

      expect(mockUpsertPnActivation).toBeCalledWith(
        environment,
        mockedUser.fiscal_code,
        {
          activationStatus: true
        }
      );

      expect(response).toEqual(
        expect.objectContaining({
          apply: expect.any(Function),
          kind: responseKind
        })
      );
    }
  );

  it("should return IResponseErrorValidation if an invalid payload is provided", async () => {
    const mockUpsertPnActivation = jest.fn();
    const controller = upsertPNActivationController(mockUpsertPnActivation);
    // Invalid payload
    req.body = {
      activation_status: "true"
    };
    req.query = {
      isTest: true
    };
    const response = await controller(req);
    response.apply(res);

    expect(mockUpsertPnActivation).not.toBeCalled();

    expect(response).toEqual(
      expect.objectContaining({
        apply: expect.any(Function),
        kind: "IResponseErrorValidation"
      })
    );
  });
});
