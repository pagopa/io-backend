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
import { constants, generateDigestHeader, sha256 } from "../crypto";
import { logLollipopSignRequest } from "../appinsights";

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
    scenario                                                                 | LCResponse                    | lollipopParams                                                                                                | eventProperties
    ${"valid params without body"}                                           | ${E.right({ status: 200 })}   | ${lollipopParams}                                                                                             | ${eventPropertiesWithoutLCResponse}
    ${"valid params with body (body removed from event)"}                    | ${E.right({ status: 200 })}   | ${{ ...lollipopParams, body: "a body", "content-digest": "a wrong content digest" }}                          | ${{ ...eventPropertiesWithoutLCResponse, "content-digest": "a wrong content digest", is_valid_content_digest: false }}
    ${"valid params with body and content-digest (body removed from event)"} | ${E.right({ status: 200 })}   | ${{ ...lollipopParams, body: "a body", "content-digest": generateDigestHeader("a body", constants.SHA_256) }} | ${{ ...eventPropertiesWithoutLCResponse, "content-digest": generateDigestHeader("a body", constants.SHA_256), is_valid_content_digest: true }}
    ${"valid params if LC forward request fail"}                             | ${E.left(new Error("Error"))} | ${{ ...lollipopParams, body: "a body", "content-digest": "a wrong content digest" }}                          | ${{ ...eventPropertiesWithoutLCResponse, "content-digest": "a wrong content digest", is_valid_content_digest: false }}
    ${"valid params with extra headers"}                                     | ${E.right({ status: 200 })}   | ${{ ...lollipopParams, "x-pagopa-extra-header": "another value" }}                                            | ${{ ...eventPropertiesWithoutLCResponse, "x-pagopa-extra-header": "another value" }}
  `(
    "should track a custom event with $scenario",
    ({
      LCResponse,
      lollipopParams,
      eventProperties
    }: {
      LCResponse: E.Either<Error, { status: number }>;
      lollipopParams: LollipopLocalsType & { "x-pagopa-extra-header"?: string };
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

  it("should typescrypt return a build error if the type mismatch", () => {
    expect.assertions(1);
    const req = mockReq();
    const mockedLCRes = E.right({
      status: 200
    });
    const invalidLollipopParamsWithoutUserId = {
      signature: aSignature,
      "signature-input": aSignatureInput,
      "x-pagopa-lollipop-original-method": aLollipopOriginalMethod,
      "x-pagopa-lollipop-original-url": aLollipopOriginalUrl,
      "x-pagopa-lollipop-assertion-ref": anAssertionRef,
      "x-pagopa-lollipop-assertion-type": AssertionTypeEnum.SAML,
      "x-pagopa-lollipop-auth-jwt": "a bearer token" as LollipopJWTAuthorization,
      "x-pagopa-lollipop-public-key": "a pub key" as LollipopPublicKey,
      "a-custom-header": "a custom header value"
    };
    try {
      logLollipopSignRequest(aLollipopConsumerId)(
        // @ts-ignore
        invalidLollipopParamsWithoutUserId,
        req
      )(mockedLCRes);
    } catch (err) {
      // We check that Jest returns an exception on type cheking fase.
      expect(err).toEqual(
        expect.objectContaining({ code: "ERR_INVALID_ARG_TYPE" })
      );
    }
  });
});
