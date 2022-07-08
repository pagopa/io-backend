import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { right, left } from "fp-ts/lib/Either";
import { PNActivation } from "../../../generated/api_piattaforma-notifiche-courtesy/PNActivation";
import { IoCourtesyDigitalAddressActivation } from "../../../generated/piattaforma-notifiche-courtesy/IoCourtesyDigitalAddressActivation";
import { PNEnvironment } from "../../clients/pn-clients";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { mockedUser } from "../../__mocks__/user_mock";
import {
  upsertPNActivationController,
  getPNActivationController
} from "../pnController";

import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";

// Generic responses mocks
const invalidResponsePnActivation = Promise.resolve(left(new Error("Error")));
const unexpectedPnActivation = Promise.resolve(
  right<never, IResponseType<599, undefined, never>>({
    headers: {},
    status: 599,
    value: undefined
  })
);
const failPnActivation = Promise.reject(new Error("error"));

// UpsertPnActivation responses mocks
const successUpsertPnActivation = Promise.resolve(
  right<never, IResponseType<204, undefined, never>>({
    headers: {},
    status: 204,
    value: undefined
  })
);
const badRequestUpsertPnActivation = Promise.resolve(
  right<never, IResponseType<400, undefined, never>>({
    headers: {},
    status: 400,
    value: undefined
  })
);

const aIoCourtesyDigitalAddressActivation: IoCourtesyDigitalAddressActivation = {
  activationStatus: true
};

// getPNActivation responses mocks
const successGetPnActivation = Promise.resolve(
  right<never, IResponseType<200, IoCourtesyDigitalAddressActivation, never>>({
    headers: {},
    status: 200,
    value: aIoCourtesyDigitalAddressActivation
  })
);
// TODO: The client generator doesn't get the response type declared with relative path from url
const notFoundGetPnActivation = Promise.resolve(
  right<never, IResponseType<404, undefined, never>>({
    headers: {},
    status: 404,
    value: undefined
  })
);
const badRequestGetPnActivation = Promise.resolve(
  right<never, IResponseType<400, undefined, never>>({
    headers: {},
    status: 400,
    value: undefined
  })
);

const res = mockRes();
const req = mockReq();
req.user = mockedUser;

describe("pnController#upsertPNActivationController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it.each`
    case                                             | environment                 | isTestValue  | pnServiceResponse               | responseKind
    ${"when service success"}                        | ${PNEnvironment.PRODUCTION} | ${undefined} | ${successUpsertPnActivation}    | ${"IResponseNoContent"}
    ${"when service success"}                        | ${PNEnvironment.UAT}        | ${true}      | ${successUpsertPnActivation}    | ${"IResponseNoContent"}
    ${"when service success"}                        | ${PNEnvironment.PRODUCTION} | ${false}     | ${successUpsertPnActivation}    | ${"IResponseNoContent"}
    ${"when service fail"}                           | ${PNEnvironment.PRODUCTION} | ${undefined} | ${failPnActivation}             | ${"IResponseErrorInternal"}
    ${"when service fail"}                           | ${PNEnvironment.UAT}        | ${true}      | ${failPnActivation}             | ${"IResponseErrorInternal"}
    ${"when service fail"}                           | ${PNEnvironment.PRODUCTION} | ${false}     | ${failPnActivation}             | ${"IResponseErrorInternal"}
    ${"when service returns bad request"}            | ${PNEnvironment.PRODUCTION} | ${undefined} | ${badRequestUpsertPnActivation} | ${"IResponseErrorInternal"}
    ${"when service returns bad request"}            | ${PNEnvironment.UAT}        | ${true}      | ${badRequestUpsertPnActivation} | ${"IResponseErrorInternal"}
    ${"when service returns bad request"}            | ${PNEnvironment.PRODUCTION} | ${false}     | ${badRequestUpsertPnActivation} | ${"IResponseErrorInternal"}
    ${"when service returns validation error"}       | ${PNEnvironment.PRODUCTION} | ${undefined} | ${invalidResponsePnActivation}  | ${"IResponseErrorInternal"}
    ${"when service returns validation error"}       | ${PNEnvironment.UAT}        | ${true}      | ${invalidResponsePnActivation}  | ${"IResponseErrorInternal"}
    ${"when service returns validation error"}       | ${PNEnvironment.PRODUCTION} | ${false}     | ${invalidResponsePnActivation}  | ${"IResponseErrorInternal"}
    ${"when service returns unexpected status code"} | ${PNEnvironment.PRODUCTION} | ${undefined} | ${unexpectedPnActivation}       | ${"IResponseErrorInternal"}
    ${"when service returns unexpected status code"} | ${PNEnvironment.UAT}        | ${true}      | ${unexpectedPnActivation}       | ${"IResponseErrorInternal"}
    ${"when service returns unexpected status code"} | ${PNEnvironment.PRODUCTION} | ${false}     | ${unexpectedPnActivation}       | ${"IResponseErrorInternal"}
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
        aIoCourtesyDigitalAddressActivation
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

describe("pnController#getPNActivationController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it.each`
    case                                             | environment                 | isTestValue  | pnServiceResponse              | responseKind                | expectedValue
    ${"when service success"}                        | ${PNEnvironment.PRODUCTION} | ${undefined} | ${successGetPnActivation}      | ${"IResponseSuccessJson"}   | ${O.some(true)}
    ${"when service success"}                        | ${PNEnvironment.UAT}        | ${true}      | ${successGetPnActivation}      | ${"IResponseSuccessJson"}   | ${O.some(true)}
    ${"when service success"}                        | ${PNEnvironment.PRODUCTION} | ${false}     | ${successGetPnActivation}      | ${"IResponseSuccessJson"}   | ${O.some(true)}
    ${"when service fail"}                           | ${PNEnvironment.PRODUCTION} | ${undefined} | ${failPnActivation}            | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service fail"}                           | ${PNEnvironment.UAT}        | ${true}      | ${failPnActivation}            | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service fail"}                           | ${PNEnvironment.PRODUCTION} | ${false}     | ${failPnActivation}            | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service returns bad request"}            | ${PNEnvironment.PRODUCTION} | ${undefined} | ${badRequestGetPnActivation}   | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service returns bad request"}            | ${PNEnvironment.UAT}        | ${true}      | ${badRequestGetPnActivation}   | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service returns bad request"}            | ${PNEnvironment.PRODUCTION} | ${false}     | ${badRequestGetPnActivation}   | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service returns validation error"}       | ${PNEnvironment.PRODUCTION} | ${undefined} | ${invalidResponsePnActivation} | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service returns validation error"}       | ${PNEnvironment.UAT}        | ${true}      | ${invalidResponsePnActivation} | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service returns validation error"}       | ${PNEnvironment.PRODUCTION} | ${false}     | ${invalidResponsePnActivation} | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service returns unexpected status code"} | ${PNEnvironment.PRODUCTION} | ${undefined} | ${unexpectedPnActivation}      | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service returns unexpected status code"} | ${PNEnvironment.UAT}        | ${true}      | ${unexpectedPnActivation}      | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service returns unexpected status code"} | ${PNEnvironment.PRODUCTION} | ${false}     | ${unexpectedPnActivation}      | ${"IResponseErrorInternal"} | ${O.none}
    ${"when service returns not found"}              | ${PNEnvironment.PRODUCTION} | ${undefined} | ${notFoundGetPnActivation}     | ${"IResponseSuccessJson"}   | ${O.some(false)}
    ${"when service returns not found"}              | ${PNEnvironment.UAT}        | ${true}      | ${notFoundGetPnActivation}     | ${"IResponseSuccessJson"}   | ${O.some(false)}
    ${"when service returns not found"}              | ${PNEnvironment.PRODUCTION} | ${false}     | ${notFoundGetPnActivation}     | ${"IResponseSuccessJson"}   | ${O.some(false)}
  `(
    "should returns a $responseKind $case on $environment environment with isTest=$isTestValue",
    async ({
      environment,
      isTestValue,
      pnServiceResponse,
      responseKind,
      expectedValue
    }: {
      environment: PNEnvironment;
      isTestValue: boolean | undefined;
      pnServiceResponse: any;
      responseKind: string;
      expectedValue: O.Option<boolean>;
    }) => {
      const mockGetPnActivation = jest.fn(
        (_: PNEnvironment, __: FiscalCode) => pnServiceResponse
      );
      const controller = getPNActivationController(mockGetPnActivation);
      req.query = {
        isTest: isTestValue
      };
      const response = await controller(req);
      response.apply(res);

      expect(mockGetPnActivation).toBeCalledWith(
        environment,
        mockedUser.fiscal_code
      );

      expect(response).toEqual(
        expect.objectContaining(
          pipe(
            expectedValue,
            O.map(activation_status => ({ activation_status })),
            O.map(value => ({
              apply: expect.any(Function),
              kind: responseKind,
              value
            })),
            O.getOrElse(() => ({
              apply: expect.any(Function),
              kind: responseKind
            }))
          )
        )
      );
    }
  );
});
