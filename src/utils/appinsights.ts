import {
  sha256,
  validateDigestHeader
} from "@pagopa/io-functions-commons/dist/src/utils/crypto";
import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withoutUndefinedValues } from "@pagopa/ts-commons/lib/types";
import { eventLog } from "@pagopa/winston-ts";
import * as ai from "applicationinsights";
import { Request } from "express";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";
import { AppInsightsConfig } from "src/config";

import { LollipopLocalsType } from "../types/lollipop";
import { toFiscalCodeHash } from "../types/notification";
import { User } from "../types/user";
import { getCurrentBackendVersion } from "./package";

// the internal function runtime has MaxTelemetryItem per second set to 20 by default
// @see https://github.com/Azure/azure-functions-host/blob/master/src/WebJobs.Script/Config/ApplicationInsightsLoggerOptionsSetup.cs#L29
const DEFAULT_SAMPLING_PERCENTAGE = 5;

const SESSION_TRACKING_ID_KEY = "session_tracking_id";
const USER_TRACKING_ID_KEY = "user_tracking_id";

/**
 * Attach the userid (CF) hash to the correlation context.
 * Also, if the user objects provides the session_tracking_id property, attach
 * it to the current correlation context.
 * Both the userid hash and the session_tracking_id get propagated to downstream
 * requests.
 *
 * Note that getCorrelationContext() returns an Application Insights context
 * that is scoped on the Express request being handled, thus this function can
 * be safely called within an Express authentication strategy.
 *
 * @see https://github.com/microsoft/ApplicationInsights-node.js/issues/392#issuecomment-387532917
 */
export function attachTrackingData(user: User): void {
  const correlationContext = ai.getCorrelationContext();

  // may happen when developing locally
  if (!correlationContext) {
    return;
  }

  const customProperties = correlationContext.customProperties;

  customProperties.setProperty(
    USER_TRACKING_ID_KEY,
    toFiscalCodeHash(user.fiscal_code)
  );

  if (user.session_tracking_id !== undefined) {
    customProperties.setProperty(
      SESSION_TRACKING_ID_KEY,
      user.session_tracking_id
    );
  }
}

export function sessionIdPreprocessor(
  envelope: ai.Contracts.Envelope,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: Readonly<Record<string, any>>
): boolean {
  if (context !== undefined) {
    try {
      const userTrackingId =
        context.correlationContext.customProperties.getProperty(
          USER_TRACKING_ID_KEY
        );
      if (userTrackingId !== undefined) {
        envelope.tags[ai.defaultClient.context.keys.userId] = userTrackingId;
      }
      const sessionTrackingId =
        context.correlationContext.customProperties.getProperty(
          SESSION_TRACKING_ID_KEY
        );
      if (sessionTrackingId !== undefined) {
        envelope.tags[ai.defaultClient.context.keys.sessionId] =
          sessionTrackingId;
      }
    } catch (e) {
      // ignore errors caused by missing properties
    }
  }
  return true;
}

/**
 * App Insights is initialized to collect the following informations:
 * - Incoming API calls
 * - Server performance information (CPU, RAM)
 * - Unandled Runtime Exceptions
 * - Outcoming API Calls (dependencies)
 * - Realtime API metrics
 */
// Avoid to initialize Application Insights more than once
export const initTelemetryClient = (config: AppInsightsConfig) =>
  pipe(
    ai.defaultClient,
    O.fromNullable,
    O.getOrElse(() => {
      const client = initAppInsights(
        config.APPINSIGHTS_CONNECTION_STRING,
        {
          applicationVersion: getCurrentBackendVersion(),
          cloudRole: config.APPINSIGHTS_CLOUD_ROLE_NAME,
          disableAppInsights: config.APPINSIGHTS_DISABLE === "true",
          samplingPercentage: pipe(
            config.APPINSIGHTS_SAMPLING_PERCENTAGE,
            O.fromNullable,
            O.getOrElse(() => DEFAULT_SAMPLING_PERCENTAGE)
          )
        }
      );
      client.addTelemetryProcessor(sessionIdPreprocessor);
      return client;
    })
  );

export type TelemetryClient = ReturnType<typeof initTelemetryClient>;

export enum StartupEventName {
  SERVER = "api-backend.httpserver.startup",
  SPID = "api-backend.spid.config"
}

export const trackStartupTime = (
  telemetryClient: TelemetryClient,
  type: StartupEventName,
  timeMs: bigint
): void => {
  pipe(
    O.fromNullable(telemetryClient),
    O.map((client) =>
      client.trackEvent({
        name: type,
        properties: {
          time: timeMs.toString()
        },
        tagOverrides: { samplingEnabled: "false" }
      })
    )
  );
};

export const LOLLIPOP_SIGN_EVENT_NAME = "lollipop.sign";

export type LCResponseLogLollipop = (
  lcResponse: E.Either<Error, { readonly status: number }>
) => void;
export type RequestLogLollipop = (
  lollipopParams: LollipopLocalsType,
  req: Request
) => LCResponseLogLollipop;

/**
 * Track a event to Application Insights with the information
 * related to a Lollipop Sign Request.
 * The event has:
 * 1. A Lollipop Consumer Identifier
 * 2. All the lollipop params related to the request
 * 3. An information about the lollipop consumer response (http status code or error)
 *
 * @returns void
 */
export const logLollipopSignRequest =
  (lollipopConsumerId: NonEmptyString) =>
  <
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends Exclude<Record<string, string>, LollipopLocalsType>
  >(
    lollipopParams: LollipopLocalsType & T,
    req: Request
  ): LCResponseLogLollipop =>
  (lcResponse: E.Either<Error, { readonly status: number }>) => {
    pipe(
      lollipopParams,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ body, ...lollipopHeadersWithoutBody }) =>
        O.fromNullable(lollipopHeadersWithoutBody),
      O.map((lollipopHeadersWithoutBody) => ({
        name: LOLLIPOP_SIGN_EVENT_NAME,
        ...lollipopHeadersWithoutBody,
        is_valid_content_digest: pipe(
          O.fromNullable(lollipopParams["content-digest"]),
          O.map((contentDigest) =>
            pipe(
              E.tryCatch(
                () => validateDigestHeader(contentDigest, lollipopParams.body),
                E.toError
              ),
              E.fold(
                () => false,
                () => true
              )
            )
          ),
          O.toUndefined
        ),
        // A string rapresenting the response from the LC.
        lc_response: pipe(
          lcResponse,
          E.map(JSON.stringify),
          E.mapLeft((err) => err.message),
          E.toUnion
        ),
        lollipop_consumer_id: lollipopConsumerId,
        method: req.method,
        original_url: req.originalUrl,
        // The fiscal code will be sent hashed to the logs
        ["x-pagopa-lollipop-user-id"]: sha256(
          lollipopHeadersWithoutBody["x-pagopa-lollipop-user-id"]
        )
      })),
      O.map(withoutUndefinedValues),
      eventLog.option.info((lollipopEventData) => [
        `Lollipop Request log`,
        lollipopEventData
      ])
    );
  };
