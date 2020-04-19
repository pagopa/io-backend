import * as appInsights from "applicationinsights";
import {
  ApplicationInsightsConfig,
  initAppInsights as startAppInsights
} from "italia-ts-commons/lib/appinsights";
import { toFiscalCodeHash } from "../types/notification";
import { User } from "../types/user";

/**
 * App Insights is initialized to collect the following informations:
 * - Incoming API calls
 * - Server performance information (CPU, RAM)
 * - Unandled Runtime Exceptions
 * - Outcoming API Calls (dependencies)
 * - Realtime API metrics
 */
export function initAppInsights(
  instrumentationKey: string,
  config: ApplicationInsightsConfig = {}
): appInsights.TelemetryClient {
  startAppInsights(instrumentationKey, config);
  appInsights.defaultClient.addTelemetryProcessor(sessionIdPreprocessor);
  return appInsights.defaultClient;
}

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
  const customProperties = appInsights.getCorrelationContext().customProperties;

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
  envelope: appInsights.Contracts.Envelope,
  context?: {
    // tslint:disable-next-line: no-any
    [name: string]: any;
  }
): boolean {
  if (context !== undefined) {
    try {
      const userTrackingId = context.correlationContext.customProperties.getProperty(
        USER_TRACKING_ID_KEY
      );
      if (userTrackingId !== undefined) {
        // tslint:disable-next-line: no-object-mutation
        envelope.tags[
          appInsights.defaultClient.context.keys.userId
        ] = userTrackingId;
      }
      const sessionTrackingId = context.correlationContext.customProperties.getProperty(
        SESSION_TRACKING_ID_KEY
      );
      if (sessionTrackingId !== undefined) {
        // tslint:disable-next-line: no-object-mutation
        envelope.tags[
          appInsights.defaultClient.context.keys.sessionId
        ] = sessionTrackingId;
      }
    } catch (e) {
      // ignore errors caused by missing properties
    }
  }
  return true;
}
