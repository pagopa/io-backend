import * as winston from "winston";

import { Context } from "@azure/functions";
import { secureExpressApp } from "io-functions-commons/dist/src/utils/express";
import { AzureContextTransport } from "io-functions-commons/dist/src/utils/logging";
import { setAppContext } from "io-functions-commons/dist/src/utils/middlewares/context_middleware";
import createAzureFunctionHandler from "io-functions-express/dist/src/createAzureFunctionsHandler";

/**
 * Main entry point for the Digital Citizenship proxy.
 */

import { fromNullable } from "fp-ts/lib/Option";
import { newApp } from "../src/app";
import {
  ALLOW_BPD_IP_SOURCE_RANGE,
  ALLOW_MYPORTAL_IP_SOURCE_RANGE,
  ALLOW_NOTIFY_IP_SOURCE_RANGE,
  ALLOW_PAGOPA_IP_SOURCE_RANGE,
  ALLOW_SESSION_HANDLER_IP_SOURCE_RANGE,
  API_BASE_PATH,
  AUTHENTICATION_BASE_PATH,
  BONUS_API_BASE_PATH,
  BPD_BASE_PATH,
  DEFAULT_APPINSIGHTS_SAMPLING_PERCENTAGE,
  ENV,
  MYPORTAL_BASE_PATH,
  PAGOPA_BASE_PATH
} from "../src/config";
import { initAppInsights } from "../src/utils/appinsights";
import {
  getCurrentBackendVersion,
  getValueFromPackageJson
} from "../src/utils/package";

const authenticationBasePath = AUTHENTICATION_BASE_PATH;
const APIBasePath = API_BASE_PATH;
const BonusAPIBasePath = BONUS_API_BASE_PATH;
const PagoPABasePath = PAGOPA_BASE_PATH;
const MyPortalBasePath = MYPORTAL_BASE_PATH;
const BPDBasePath = BPD_BASE_PATH;

/**
 * If APPINSIGHTS_INSTRUMENTATIONKEY env is provided initialize an App Insights Client
 * WARNING: When the key is provided several information are collected automatically
 * and sent to App Insights.
 * To see what kind of informations are automatically collected
 * @see: utils/appinsights.js into the class AppInsightsClientBuilder
 */
const maybeAppInsightsClient = fromNullable(
  process.env.APPINSIGHTS_INSTRUMENTATIONKEY
).map(k =>
  initAppInsights(k, {
    applicationVersion: getCurrentBackendVersion(),
    cloudRole: getValueFromPackageJson("name"),
    disableAppInsights: process.env.APPINSIGHTS_DISABLED === "true",
    samplingPercentage: process.env.APPINSIGHTS_SAMPLING_PERCENTAGE
      ? parseInt(process.env.APPINSIGHTS_SAMPLING_PERCENTAGE, 10)
      : DEFAULT_APPINSIGHTS_SAMPLING_PERCENTAGE
  })
);

// tslint:disable-next-line: no-let
let logger: Context["log"] | undefined;
const contextTransport = new AzureContextTransport(() => logger, {
  level: "debug"
});
winston.add(contextTransport);

// Setup Express
const init = newApp({
  APIBasePath,
  BPDBasePath,
  BonusAPIBasePath,
  MyPortalBasePath,
  PagoPABasePath,
  allowBPDIPSourceRange: ALLOW_BPD_IP_SOURCE_RANGE,
  allowMyPortalIPSourceRange: ALLOW_MYPORTAL_IP_SOURCE_RANGE,
  allowNotifyIPSourceRange: ALLOW_NOTIFY_IP_SOURCE_RANGE,
  allowPagoPAIPSourceRange: ALLOW_PAGOPA_IP_SOURCE_RANGE,
  allowSessionHandleIPSourceRange: ALLOW_SESSION_HANDLER_IP_SOURCE_RANGE,
  appInsightsClient: maybeAppInsightsClient.toUndefined(),
  authenticationBasePath,
  env: ENV
}).then(app => {
  secureExpressApp(app);
  return {
    app,
    azureFunctionHandler: createAzureFunctionHandler(app)
  };
});

// Binds the express app to an Azure Function handler
function httpStart(context: Context): void {
  logger = context.log;
  init
    .then(({ app, azureFunctionHandler }) => {
      setAppContext(app, context);
      azureFunctionHandler(context);
    })
    .catch(context.log);
}

export default httpStart;
