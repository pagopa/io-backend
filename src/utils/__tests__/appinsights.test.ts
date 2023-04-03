import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { LollipopJWTAuthorization } from "../../../generated/io-sign-api/LollipopJWTAuthorization";
import { LollipopPublicKey } from "../../../generated/io-sign-api/LollipopPublicKey";
import { AssertionTypeEnum } from "../../../generated/lollipop-api/AssertionType";
import { LollipopLocalsType } from "../../types/lollipop";
import {
  aLollipopOriginalMethod,
  aLollipopOriginalUrl,
  anAssertionRef,
  aSignature,
  aSignatureInput
} from "../../__mocks__/lollipop";
import mockReq from "../../__mocks__/request";
import { aFiscalCode } from "../../__mocks__/user_mock";
import * as E from "fp-ts/lib/Either";
import { LoggerId } from "@pagopa/winston-ts/dist/types/logging";
import { withApplicationInsight } from "@pagopa/io-functions-commons/dist/src/utils/transports/application_insight";
import { TelemetryClient } from "applicationinsights";
import { useWinstonFor } from "@pagopa/winston-ts";
import { LOLLIPOP_SIGN_EVENT_NAME } from "../appinsights";
import { sha256 } from "../crypto";

const lollipopParams: LollipopLocalsType = {
  signature: aSignature,
  "signature-input": aSignatureInput,
  "x-pagopa-lollipop-original-method": aLollipopOriginalMethod,
  "x-pagopa-lollipop-original-url": aLollipopOriginalUrl,
  "x-pagopa-lollipop-assertion-ref": anAssertionRef,
  "x-pagopa-lollipop-assertion-type": AssertionTypeEnum.SAML,
  "x-pagopa-lollipop-auth-jwt": "a bearer token" as LollipopJWTAuthorization,
  "x-pagopa-lollipop-public-key": "a pub key" as LollipopPublicKey,
  "x-pagopa-lollipop-user-id": aFiscalCode
};
const aLollipopConsumerId = "first-lollipop-consumer-id" as NonEmptyString;

const logLollipopSignRequest = require("../appinsights")[
  "logLollipopSignRequest"
];
const mockTrackEvent = jest.fn();
const mockedTelemetryClient = ({
  trackEvent: mockTrackEvent
} as unknown) as TelemetryClient;
useWinstonFor({
  loggerId: LoggerId.event,
  transports: [withApplicationInsight(mockedTelemetryClient, "io-backend")]
});
describe("logLollipopSignRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const expectedMethod = "POST";
  const expectedOriginalUrl = "https://localhost";
  const eventPropertiesWithoutLCResponse = {
    ...lollipopParams,
    "x-pagopa-lollipop-user-id": sha256(aFiscalCode),
    lollipop_consumer_id: aLollipopConsumerId,
    method: expectedMethod,
    original_url: expectedOriginalUrl,
    message: "Lollipop Request log"
  };

  it.each`
    scenario                                              | LCResponse                    | lollipopParams                                                                 | eventProperties
    ${"valid params without body"}                        | ${E.right({ status: 200 })}   | ${lollipopParams}                                                              | ${eventPropertiesWithoutLCResponse}
    ${"valid params with body (body removed from event)"} | ${E.right({ status: 200 })}   | ${{ ...lollipopParams, body: "a body", "content-digest": "a content digest" }} | ${{ ...eventPropertiesWithoutLCResponse, "content-digest": "a content digest" }}
    ${"valid params if LC forward request fail"}          | ${E.left(new Error("Error"))} | ${{ ...lollipopParams, body: "a body", "content-digest": "a content digest" }} | ${{ ...eventPropertiesWithoutLCResponse, "content-digest": "a content digest" }}
  `(
    "should track a custom event with $scenario",
    ({
      LCResponse,
      lollipopParams,
      eventProperties
    }: {
      LCResponse: E.Either<Error, { status: number }>;
      lollipopParams: LollipopLocalsType;
      eventProperties: any;
    }) => {
      const req = mockReq();
      req.method = expectedMethod;
      req.originalUrl = expectedOriginalUrl;

      const mockedLCRes = LCResponse;
      logLollipopSignRequest(aLollipopConsumerId)(lollipopParams, req)(
        mockedLCRes
      );
      expect(mockTrackEvent).toBeCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: `io-backend.info.${LOLLIPOP_SIGN_EVENT_NAME}`,
        properties: {
          ...eventProperties,
          lc_response: E.isRight(LCResponse)
            ? JSON.stringify(LCResponse.right)
            : LCResponse.left.message
        },
        tagOverrides: { samplingEnabled: "false" }
      });
    }
  );
});
