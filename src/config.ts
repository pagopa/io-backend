/**
 * Defines services and register them to the Service Container.
 */

import { agent } from "@pagopa/ts-commons";
import { getNodeEnvironmentFromProcessEnv } from "@pagopa/ts-commons/lib/environment";
import {
  AbortableFetch,
  setFetchTimeout,
  toFetch
} from "@pagopa/ts-commons/lib/fetch";
import { IntegerFromString } from "@pagopa/ts-commons/lib/numbers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString, Ulid } from "@pagopa/ts-commons/lib/strings";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { Millisecond } from "@pagopa/ts-commons/lib/units";
import { HttpsUrlFromString, UrlFromString } from "@pagopa/ts-commons/lib/url";
import * as dotenv from "dotenv";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { AppMessagesAPIClient } from "./clients/app-messages.client";
import { BonusAPIClient } from "./clients/bonus";
import { CgnAPIClient } from "./clients/cgn";
import { CgnOperatorSearchAPIClient } from "./clients/cgn-operator-search";
import { FirstLollipopConsumerClient } from "./clients/firstLollipopConsumer";
import { IoFimsAPIClient } from "./clients/io-fims";
import { IoSignAPIClient } from "./clients/io-sign";
import { IoWalletAPIClient } from "./clients/io-wallet";
import { LollipopApiClient } from "./clients/lollipop";
import { getPagoPaEcommerceClient } from "./clients/pagopa-ecommerce";
import { PNClientFactory } from "./clients/pn-clients";
import { ServicesAppBackendAPIClient } from "./clients/services-app-backend";
import { TrialSystemAPIClient } from "./clients/trial-system.client";
import ApiClientFactory from "./services/apiClientFactory";
import PagoPAClientFactory from "./services/pagoPAClientFactory";
import { getRequiredENVVar } from "./utils/container";
import {
  FeatureFlag,
  FeatureFlagEnum,
  getIsUserEligibleForNewFeature
} from "./utils/featureFlag";
import { log } from "./utils/logger";
import { decodeCIDRs } from "./utils/network";
import { ognlTypeFor } from "./utils/ognl";
import { CommaSeparatedListOf } from "./utils/separated-list";

// Without this, the environment variables loaded by dotenv aren't available in
// this file.
dotenv.config();

// Server port.
log.info(`App service assigned port ${process.env.PORT}`);
const DEFAULT_SERVER_PORT = "80";
export const SERVER_PORT = process.env.PORT || DEFAULT_SERVER_PORT;

export const ENV = getNodeEnvironmentFromProcessEnv(process.env);

// Default cache control max-age value is 5 minutes
const DEFAULT_CACHE_MAX_AGE_SECONDS: string = "300";

// Resolve cache control default max-age value
// @deprecated this value is not used anymore.
export const CACHE_MAX_AGE_SECONDS: number = parseInt(
  process.env.CACHE_MAX_AGE_SECONDS || DEFAULT_CACHE_MAX_AGE_SECONDS,
  10
);

// Default cache control max-age value is 1 hour
const DEFAULT_CGN_OPERATOR_SEARCH_CACHE_MAX_AGE_SECONDS: string = "3600";

// Resolve cache control default max-age value
// @deprecated this value is not used anymore.
export const CGN_OPERATOR_SEARCH_CACHE_MAX_AGE_SECONDS: number = parseInt(
  process.env.CGN_OPERATOR_SEARCH_CACHE_MAX_AGE_SECONDS ||
    DEFAULT_CGN_OPERATOR_SEARCH_CACHE_MAX_AGE_SECONDS,
  10
);

// IP(s) or CIDR(s) allowed for notification
export const ALLOW_NOTIFY_IP_SOURCE_RANGE = pipe(
  process.env.ALLOW_NOTIFY_IP_SOURCE_RANGE,
  decodeCIDRs,
  E.getOrElseW((errs) => {
    log.error(
      `Missing or invalid ALLOW_NOTIFY_IP_SOURCE_RANGE environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

const DEFAULT_REQUEST_TIMEOUT_MS = 10000 as Millisecond;

// Generic HTTP/HTTPS fetch with optional keepalive agent
// @see https://github.com/pagopa/io-ts-commons/blob/master/src/agent.ts#L10
const abortableFetch = AbortableFetch(agent.getFetch(process.env));
const fetchWithTimeout = setFetchTimeout(
  DEFAULT_REQUEST_TIMEOUT_MS,
  abortableFetch
);

const httpOrHttpsApiFetch = toFetch(fetchWithTimeout);

const bearerAuthFetch =
  (origFetch: typeof fetch = fetch, bearerToken: string): typeof fetch =>
  (input, init) =>
    origFetch(input, {
      ...init,
      headers: { Authorization: `Bearer ${bearerToken}` }
    });

export const getHttpsApiFetchWithBearer = (bearer: string) =>
  toFetch(
    setFetchTimeout(
      DEFAULT_REQUEST_TIMEOUT_MS,
      AbortableFetch(bearerAuthFetch(httpOrHttpsApiFetch, bearer))
    )
  );

export const API_KEY = getRequiredENVVar("API_KEY");
export const API_URL = getRequiredENVVar("API_URL");
export const API_BASE_PATH = getRequiredENVVar("API_BASE_PATH");
export const API_CLIENT = new ApiClientFactory(
  API_KEY,
  API_URL,
  httpOrHttpsApiFetch
);

export const APP_MESSAGES_API_KEY = getRequiredENVVar("APP_MESSAGES_API_KEY");
export const APP_MESSAGES_API_URL = getRequiredENVVar("APP_MESSAGES_API_URL");

export const APP_MESSAGES_API_CLIENT = AppMessagesAPIClient(
  APP_MESSAGES_API_KEY,
  APP_MESSAGES_API_URL,
  httpOrHttpsApiFetch
);

export const BONUS_API_KEY = getRequiredENVVar("BONUS_API_KEY");
export const BONUS_API_URL = getRequiredENVVar("BONUS_API_URL");
export const BONUS_API_BASE_PATH = getRequiredENVVar("BONUS_API_BASE_PATH");
export const BONUS_API_CLIENT = BonusAPIClient(
  BONUS_API_KEY,
  BONUS_API_URL,
  httpOrHttpsApiFetch
);

export const IO_SIGN_API_KEY = getRequiredENVVar("IO_SIGN_API_KEY");
export const IO_SIGN_API_URL = getRequiredENVVar("IO_SIGN_API_URL");
export const IO_SIGN_SERVICE_ID = getRequiredENVVar("IO_SIGN_SERVICE_ID");
export const IO_SIGN_API_BASE_PATH = getRequiredENVVar("IO_SIGN_API_BASE_PATH");
export const IO_SIGN_API_CLIENT = IoSignAPIClient(
  IO_SIGN_API_KEY,
  IO_SIGN_API_URL,
  IO_SIGN_API_BASE_PATH,
  httpOrHttpsApiFetch
);

export const IO_FIMS_API_KEY = getRequiredENVVar("IO_FIMS_API_KEY");
export const IO_FIMS_API_URL = getRequiredENVVar("IO_FIMS_API_URL");
export const IO_FIMS_API_BASE_PATH = getRequiredENVVar("IO_FIMS_API_BASE_PATH");
export const IO_FIMS_API_CLIENT = IoFimsAPIClient(
  IO_FIMS_API_KEY,
  IO_FIMS_API_URL,
  IO_FIMS_API_BASE_PATH,
  httpOrHttpsApiFetch
);

export const CGN_API_KEY = getRequiredENVVar("CGN_API_KEY");
export const CGN_API_URL = getRequiredENVVar("CGN_API_URL");
export const CGN_API_BASE_PATH = getRequiredENVVar("CGN_API_BASE_PATH");
export const CGN_API_CLIENT = CgnAPIClient(
  CGN_API_KEY,
  CGN_API_URL,
  CGN_API_BASE_PATH,
  httpOrHttpsApiFetch
);

export const LOLLIPOP_API_KEY = getRequiredENVVar("LOLLIPOP_API_KEY");
export const LOLLIPOP_API_URL = getRequiredENVVar("LOLLIPOP_API_URL");
export const LOLLIPOP_API_BASE_PATH = getRequiredENVVar(
  "LOLLIPOP_API_BASE_PATH"
);
export const LOLLIPOP_API_CLIENT = LollipopApiClient(
  LOLLIPOP_API_KEY,
  LOLLIPOP_API_URL,
  LOLLIPOP_API_BASE_PATH,
  httpOrHttpsApiFetch
);

export const FIRST_LOLLIPOP_CONSUMER_CLIENT = FirstLollipopConsumerClient(
  // We access to the first lollipop consumer implementation that is now located
  // within the Lollipop function.
  LOLLIPOP_API_KEY,
  LOLLIPOP_API_URL
);

export const CGN_OPERATOR_SEARCH_API_KEY = getRequiredENVVar(
  "CGN_OPERATOR_SEARCH_API_KEY"
);
export const CGN_OPERATOR_SEARCH_API_URL = getRequiredENVVar(
  "CGN_OPERATOR_SEARCH_API_URL"
);
export const CGN_OPERATOR_SEARCH_API_BASE_PATH = getRequiredENVVar(
  "CGN_OPERATOR_SEARCH_API_BASE_PATH"
);
export const CGN_OPERATOR_SEARCH_API_CLIENT = CgnOperatorSearchAPIClient(
  CGN_OPERATOR_SEARCH_API_KEY,
  CGN_OPERATOR_SEARCH_API_URL,
  CGN_OPERATOR_SEARCH_API_BASE_PATH,
  httpOrHttpsApiFetch
);

export const SERVICES_APP_BACKEND_API_BASE_PATH = getRequiredENVVar(
  "SERVICES_APP_BACKEND_API_BASE_PATH"
);
export const SERVICES_APP_BACKEND_API_URL = getRequiredENVVar(
  "SERVICES_APP_BACKEND_API_URL"
);

// TODO: creare servicesAppBackend client
export const SERVICES_APP_BACKEND_CLIENT = ServicesAppBackendAPIClient(
  SERVICES_APP_BACKEND_API_URL,
  SERVICES_APP_BACKEND_API_BASE_PATH,
  httpOrHttpsApiFetch
);

/**
 * Piattaforma Notifiche configuration environments variables.
 * Missing or invalid variables kill the backend process.
 *
 * `FF_PN_ACTIVATION_ENABLED` feature flag enable the mounting
 * of activation endpoints.
 */

const IEnabledPnAddressBookConfig = t.interface({
  FF_PN_ACTIVATION_ENABLED: t.literal("1"),
  PN_ACTIVATION_BASE_PATH: t.string,
  PN_API_KEY: NonEmptyString,
  PN_API_KEY_UAT: NonEmptyString,
  PN_API_URL: UrlFromString,
  PN_API_URL_UAT: UrlFromString
});
type IEnabledPnAddressBookConfig = t.TypeOf<typeof IEnabledPnAddressBookConfig>;

const IPNAddressBookConfig = t.union([
  IEnabledPnAddressBookConfig,
  t.partial({
    FF_PN_ACTIVATION_ENABLED: t.literal("0")
  })
]);
type IPNAddressBookConfig = t.TypeOf<typeof IPNAddressBookConfig>;

export const PNAddressBookConfig = pipe(
  process.env,
  IPNAddressBookConfig.decode,
  E.getOrElseW((errs) => {
    log.error(
      `Missing or invalid PN Address book configuration envs: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

export const PN_ADDRESS_BOOK_CLIENT_SELECTOR: O.Option<
  ReturnType<typeof PNClientFactory>
> = pipe(
  PNAddressBookConfig,
  E.fromPredicate(IEnabledPnAddressBookConfig.is, () => O.none),
  E.map((pnConfig) =>
    O.some(
      PNClientFactory(
        pnConfig.PN_API_URL,
        pnConfig.PN_API_KEY,
        pnConfig.PN_API_URL_UAT,
        pnConfig.PN_API_KEY_UAT,
        httpOrHttpsApiFetch
      )
    )
  ),
  E.toUnion
);

// HTTPs-only fetch with optional keepalive agent
// @see https://github.com/pagopa/io-ts-commons/blob/master/src/agent.ts#L10
const simpleHttpsApiFetch = agent.getHttpsFetch(process.env);

// Register a factory service to create PagoPA client.
const pagoPAApiUrlProd = getRequiredENVVar("PAGOPA_API_URL_PROD");
const pagoPAApiUrlTest = getRequiredENVVar("PAGOPA_API_URL_TEST");
const pagoPAApiKeyProd = getRequiredENVVar("PAGOPA_API_KEY_PROD");
const pagoPAApiKeyTest = getRequiredENVVar("PAGOPA_API_KEY_UAT");
export const PAGOPA_CLIENT = new PagoPAClientFactory(
  pagoPAApiUrlProd,
  pagoPAApiKeyProd,
  pagoPAApiUrlTest,
  pagoPAApiKeyTest,
  simpleHttpsApiFetch
);

const pagoPAEcommerceApiUrl = getRequiredENVVar("PAGOPA_ECOMMERCE_BASE_URL");
const pagoPAEcommerceApiKey = getRequiredENVVar("PAGOPA_ECOMMERCE_API_KEY");
const pagoPAEcommerceUatApiUrl = getRequiredENVVar(
  "PAGOPA_ECOMMERCE_UAT_BASE_URL"
);
const pagoPAEcommerceUatApiKey = getRequiredENVVar(
  "PAGOPA_ECOMMERCE_UAT_API_KEY"
);
export const PAGOPA_ECOMMERCE_CLIENT = getPagoPaEcommerceClient(
  pagoPAEcommerceApiUrl,
  pagoPAEcommerceApiKey,
  simpleHttpsApiFetch
);

export const PAGOPA_ECOMMERCE_UAT_CLIENT = getPagoPaEcommerceClient(
  pagoPAEcommerceUatApiUrl,
  pagoPAEcommerceUatApiKey,
  simpleHttpsApiFetch
);

// API endpoint mount.
export const AUTHENTICATION_BASE_PATH = getRequiredENVVar(
  "AUTHENTICATION_BASE_PATH"
);

export const SERVICES_APP_BACKEND_BASE_PATH = getRequiredENVVar(
  "SERVICES_APP_BACKEND_BASE_PATH"
);

// Needed to forward push notifications actions events
export const NOTIFICATIONS_STORAGE_CONNECTION_STRING = getRequiredENVVar(
  "NOTIFICATIONS_STORAGE_CONNECTION_STRING"
);
export const NOTIFICATIONS_QUEUE_NAME = getRequiredENVVar(
  "NOTIFICATIONS_QUEUE_NAME"
);

// Needed to forward push notifications actions events
export const PUSH_NOTIFICATIONS_STORAGE_CONNECTION_STRING = getRequiredENVVar(
  "PUSH_NOTIFICATIONS_STORAGE_CONNECTION_STRING"
);
export const PUSH_NOTIFICATIONS_QUEUE_NAME = getRequiredENVVar(
  "PUSH_NOTIFICATIONS_QUEUE_NAME"
);

// Root redirect
const DEFAULT_ROOT_REDIRECT_URL = pipe(
  "https://io.italia.it",
  HttpsUrlFromString.decode,
  E.getOrElseW((errs) => {
    log.error(
      `Invalid DEFAULT_ROOT_REDIRECT_URL variable: ${readableReport(errs)}`
    );
    return process.exit(1);
  })
);

export const ROOT_REDIRECT_URL = pipe(
  process.env.ROOT_REDIRECT_URL,
  HttpsUrlFromString.decode,
  E.getOrElse((errs) => {
    log.warn(
      `Missing or invalid ROOT_REDIRECT_URL variable, defaulting to "${
        DEFAULT_ROOT_REDIRECT_URL.href
      }": ${readableReport(errs)}`
    );
    return DEFAULT_ROOT_REDIRECT_URL;
  })
);

// Push notifications
export const NOTIFICATION_DEFAULT_SUBJECT =
  "Entra nell'app per leggere il contenuto";
export const NOTIFICATION_DEFAULT_TITLE = "Hai un nuovo messaggio su IO";

export const BARCODE_ALGORITHM = pipe(
  process.env.BARCODE_ALGORITHM,
  NonEmptyString.decode,
  E.getOrElse(() => "code128" as NonEmptyString)
);

// Application insight
export type AppInsightsConfig = t.TypeOf<typeof AppInsightsConfig>;
export const AppInsightsConfig = t.intersection([
  t.type({
    APPINSIGHTS_CLOUD_ROLE_NAME: NonEmptyString,
    APPINSIGHTS_CONNECTION_STRING: NonEmptyString
  }),
  t.partial({
    APPINSIGHTS_DISABLE: NonEmptyString,
    APPINSIGHTS_SAMPLING_PERCENTAGE: IntegerFromString
  })
]);

export const errorOrAppInsightConfig: t.Validation<AppInsightsConfig> =
  AppInsightsConfig.decode(process.env);

// Feature flags
export const FF_BONUS_ENABLED = process.env.FF_BONUS_ENABLED === "1";
export const FF_CGN_ENABLED = process.env.FF_CGN_ENABLED === "1";
export const FF_IO_SIGN_ENABLED = process.env.FF_IO_SIGN_ENABLED === "1";
export const FF_IO_FIMS_ENABLED = process.env.FF_IO_FIMS_ENABLED === "1";

export const TEST_CGN_FISCAL_CODES = pipe(
  process.env.TEST_CGN_FISCAL_CODES || "",
  CommaSeparatedListOf(FiscalCode).decode,
  E.getOrElseW((err) => {
    throw new Error(
      `Invalid TEST_CGN_FISCAL_CODES value: ${readableReport(err)}`
    );
  })
);

// PEC SERVER config
export const PecServerConfig = t.interface({
  basePath: t.string,
  secret: NonEmptyString,
  serviceId: NonEmptyString,
  url: NonEmptyString
});
export type PecServerConfig = t.TypeOf<typeof PecServerConfig>;

export const PecServersConfig = t.interface({
  aruba: PecServerConfig,
  poste: PecServerConfig
});
export type PecServersConfig = t.TypeOf<typeof PecServersConfig>;

export const PECSERVERS = pipe(
  process.env,
  ognlTypeFor<PecServersConfig>(PecServersConfig, "PECSERVERS").decode,
  E.getOrElseW((errs) => {
    log.error(
      `Missing or invalid PECSERVERS environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);
//

// PN Service Id
export const PN_SERVICE_ID = pipe(
  process.env.PN_SERVICE_ID,
  NonEmptyString.decode,
  E.getOrElseW((errs) => {
    log.error(
      `Missing or invalid PN_SERVICE_ID environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

export const PN_CONFIGURATION_ID = pipe(
  process.env.PN_CONFIGURATION_ID,
  Ulid.decode,
  E.getOrElseW((errs) => {
    log.error(
      `Missing or invalid PN_CONFIGURATION_ID environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

export const FF_ROUTING_PUSH_NOTIF = pipe(
  process.env.FF_ROUTING_PUSH_NOTIF,
  FeatureFlag.decode,
  E.getOrElse(() => FeatureFlagEnum.NONE)
);

export const FF_ROUTING_PUSH_NOTIF_BETA_TESTER_SHA_LIST = pipe(
  process.env.FF_ROUTING_PUSH_NOTIF_BETA_TESTER_SHA_LIST,
  CommaSeparatedListOf(NonEmptyString).decode,
  E.getOrElseW((errs) => {
    log.error(
      `Missing or invalid FF_ROUTING_PUSH_NOTIF_BETA_TESTER_SHA_LIST environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);
export const FF_ROUTING_PUSH_NOTIF_CANARY_SHA_USERS_REGEX = pipe(
  process.env.FF_ROUTING_PUSH_NOTIF_CANARY_SHA_USERS_REGEX,
  NonEmptyString.decode,
  E.getOrElse(() => "XYZ" as NonEmptyString)
);

// UNIQUE EMAIL ENFORCEMENT variables

export const FF_UNIQUE_EMAIL_ENFORCEMENT = pipe(
  process.env.FF_UNIQUE_EMAIL_ENFORCEMENT,
  FeatureFlag.decode,
  E.getOrElseW(() => FeatureFlagEnum.NONE)
);

export const UNIQUE_EMAIL_ENFORCEMENT_USERS = pipe(
  process.env.UNIQUE_EMAIL_ENFORCEMENT_USERS,
  // TODO(IOPID-1256): produce a ReadonlySet instead of ReadonlyArray
  CommaSeparatedListOf(FiscalCode).decode,
  E.getOrElseW((err) => {
    throw new Error(
      `Invalid UNIQUE_EMAIL_ENFORCEMENT_USERS value: ${readableReport(err)}`
    );
  })
);

export const FF_UNIQUE_EMAIL_ENFORCEMENT_ENABLED =
  getIsUserEligibleForNewFeature<FiscalCode>(
    (fiscalCode) => UNIQUE_EMAIL_ENFORCEMENT_USERS.includes(fiscalCode),
    () => false,
    FF_UNIQUE_EMAIL_ENFORCEMENT
  );

// ####### TRIAL_SYSTEM ########
export const FF_TRIAL_SYSTEM_ENABLED =
  process.env.FF_TRIAL_SYSTEM_ENABLED === "1";

export const TRIAL_SYSTEM_API_BASE_PATH = getRequiredENVVar(
  "TRIAL_SYSTEM_API_BASE_PATH"
);
export const TRIAL_SYSTEM_API_KEY = getRequiredENVVar("TRIAL_SYSTEM_APIM_KEY");
export const TRIAL_SYSTEM_API_URL = getRequiredENVVar("TRIAL_SYSTEM_APIM_URL");
export const TRIAL_SYSTEM_APIM_BASE_PATH = getRequiredENVVar(
  "TRIAL_SYSTEM_APIM_BASE_PATH"
);

export const TRIAL_SYSTEM_CLIENT = TrialSystemAPIClient(
  TRIAL_SYSTEM_API_KEY,
  TRIAL_SYSTEM_API_URL,
  TRIAL_SYSTEM_APIM_BASE_PATH
);
export const IO_WALLET_API_KEY = getRequiredENVVar("IO_WALLET_API_KEY");
export const IO_WALLET_API_URL = getRequiredENVVar("IO_WALLET_API_URL");
export const IO_WALLET_API_BASE_PATH = getRequiredENVVar(
  "IO_WALLET_API_BASE_PATH"
);
export const IO_WALLET_TRIAL_ID = getRequiredENVVar("IO_WALLET_TRIAL_ID");
export const IO_WALLET_API_CLIENT = IoWalletAPIClient(
  IO_WALLET_API_KEY,
  IO_WALLET_API_BASE_PATH,
  IO_WALLET_API_URL,
  httpOrHttpsApiFetch
);
export const FF_IO_WALLET_ENABLED = process.env.FF_IO_WALLET_ENABLED === "1";
export const FF_IO_WALLET_TRIAL_ENABLED =
  process.env.FF_IO_WALLET_TRIAL_ENABLED === "1";

const IO_WALLET_UAT_API_KEY = getRequiredENVVar("IO_WALLET_UAT_API_KEY");
export const IO_WALLET_UAT_API_BASE_PATH = getRequiredENVVar(
  "IO_WALLET_UAT_API_BASE_PATH"
);
const IO_WALLET_UAT_API_URL = getRequiredENVVar("IO_WALLET_UAT_API_URL");
export const IO_WALLET_UAT_API_CLIENT = IoWalletAPIClient(
  IO_WALLET_UAT_API_KEY,
  "",
  IO_WALLET_UAT_API_URL,
  httpOrHttpsApiFetch
);

export const FF_IO_X_USER_TOKEN = pipe(
  process.env.FF_IO_X_USER_TOKEN,
  FeatureFlag.decode,
  E.getOrElse(() => FeatureFlagEnum.NONE)
);
export const FF_IO_X_USER_TOKEN_BETA_TESTER_SHA_LIST = pipe(
  process.env.FF_IO_X_USER_TOKEN_BETA_TESTER_SHA_LIST,
  CommaSeparatedListOf(NonEmptyString).decode,
  E.getOrElseW((errs) => {
    log.error(
      `Missing or invalid FF_IO_X_USER_TOKEN_BETA_TESTER_SHA_LIST environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);
export const FF_IO_X_USER_TOKEN_CANARY_SHA_USERS_REGEX = pipe(
  process.env.FF_IO_X_USER_TOKEN_CANARY_SHA_USERS_REGEX,
  NonEmptyString.decode,
  E.getOrElse(() => "XYZ" as NonEmptyString)
);
