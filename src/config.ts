/**
 * Defines services and register them to the Service Container.
 */

import * as dotenv from "dotenv";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as t from "io-ts";
import { toError } from "fp-ts/lib/Either";
import { agent } from "@pagopa/ts-commons";

import {
  getNodeEnvironmentFromProcessEnv,
  NodeEnvironmentEnum
} from "@pagopa/ts-commons/lib/environment";
import {
  errorsToReadableMessages,
  readableReport
} from "@pagopa/ts-commons/lib/reporters";
import { UrlFromString } from "@pagopa/ts-commons/lib/url";

import {
  IApplicationConfig,
  IServiceProviderConfig,
  SamlConfig
} from "@pagopa/io-spid-commons";

import * as A from "fp-ts/lib/Array";
import {
  AbortableFetch,
  setFetchTimeout,
  toFetch
} from "@pagopa/ts-commons/lib/fetch";
import { IntegerFromString } from "@pagopa/ts-commons/lib/numbers";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { Millisecond, Second } from "@pagopa/ts-commons/lib/units";
import { pipe } from "fp-ts/lib/function";
import * as S from "fp-ts/lib/string";
import { record } from "fp-ts";
import { CgnAPIClient } from "./clients/cgn";
import { log } from "./utils/logger";
import urlTokenStrategy from "./strategies/urlTokenStrategy";
import { getRequiredENVVar, readFile } from "./utils/container";
import PagoPAClientFactory from "./services/pagoPAClientFactory";
import ApiClientFactory from "./services/apiClientFactory";
import { BonusAPIClient } from "./clients/bonus";
import { STRINGS_RECORD } from "./types/commons";
import { SpidLevelArray } from "./types/spidLevel";
import { decodeCIDRs } from "./utils/cidrs";
import { CgnOperatorSearchAPIClient } from "./clients/cgn-operator-search";
import { EUCovidCertAPIClient } from "./clients/eucovidcert.client";
import { ognlTypeFor } from "./utils/ognl";
import { AppMessagesAPIClient } from "./clients/app-messages.client";
import { ThirdPartyConfigListFromString } from "./utils/thirdPartyConfig";
import { PNClientFactory } from "./clients/pn-clients";
import { IoSignAPIClient } from "./clients/io-sign";
import { FeatureFlag, FeatureFlagEnum } from "./utils/featureFlag";
import { CommaSeparatedListOf } from "./utils/separated-list";
import { LollipopApiClient } from "./clients/lollipop";
import { FirstLollipopConsumerClient } from "./clients/firstLollipopConsumer";

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
export const CACHE_MAX_AGE_SECONDS: number = parseInt(
  process.env.CACHE_MAX_AGE_SECONDS || DEFAULT_CACHE_MAX_AGE_SECONDS,
  10
);

export const ENABLE_NOTICE_EMAIL_CACHE: boolean = pipe(
  process.env.ENABLE_NOTICE_EMAIL_CACHE,
  O.fromNullable,
  O.map(_ => _.toLowerCase() === "true"),
  O.getOrElseW(() => false)
);

// Default cache control max-age value is 1 hour
const DEFAULT_CGN_OPERATOR_SEARCH_CACHE_MAX_AGE_SECONDS: string = "3600";

// Resolve cache control default max-age value
export const CGN_OPERATOR_SEARCH_CACHE_MAX_AGE_SECONDS: number = parseInt(
  process.env.CGN_OPERATOR_SEARCH_CACHE_MAX_AGE_SECONDS ||
    DEFAULT_CGN_OPERATOR_SEARCH_CACHE_MAX_AGE_SECONDS,
  10
);

// Private key used in SAML authentication to a SPID IDP.
const samlKey = () =>
  pipe(
    process.env.SAML_KEY,
    O.fromNullable,
    O.getOrElse(() =>
      readFile(
        process.env.SAML_KEY_PATH || "./certs/key.pem",
        "SAML private key"
      )
    )
  );
export const SAML_KEY = samlKey();

// Public certificate used in SAML authentication to a SPID IDP.
const samlCert = () =>
  pipe(
    process.env.SAML_CERT,
    O.fromNullable,
    O.getOrElse(() =>
      readFile(
        process.env.SAML_CERT_PATH || "./certs/cert.pem",
        "SAML certificate"
      )
    )
  );

export const SAML_CERT = samlCert();

// SAML settings.
const SAML_CALLBACK_URL =
  process.env.SAML_CALLBACK_URL ||
  "http://italia-backend/assertionConsumerService";
const SAML_LOGOUT_CALLBACK_URL =
  process.env.SAML_LOGOUT_CALLBACK_URL || "http://italia-backend/slo";
const SAML_ISSUER = process.env.SAML_ISSUER || "https://spid.agid.gov.it/cd";
const DEFAULT_SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX = "1";
const SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX =
  process.env.SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX ||
  DEFAULT_SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX;
// Default SAML Request cache is 10 minutes
const DEFAULT_SAML_REQUEST_EXPIRATION_PERIOD_MS = 10 * 60 * 1000;
const SAML_REQUEST_EXPIRATION_PERIOD_MS = pipe(
  process.env.SAML_REQUEST_EXPIRATION_PERIOD_MS,
  E.fromNullable(new Error("Missing Environment configuration")),
  E.chain(_ => pipe(IntegerFromString.decode(_), E.mapLeft(toError))),
  E.getOrElse(() => DEFAULT_SAML_REQUEST_EXPIRATION_PERIOD_MS)
);
const DEFAULT_SAML_ACCEPTED_CLOCK_SKEW_MS = "-1";
const SAML_ACCEPTED_CLOCK_SKEW_MS = parseInt(
  process.env.SAML_ACCEPTED_CLOCK_SKEW_MS ||
    DEFAULT_SAML_ACCEPTED_CLOCK_SKEW_MS,
  10
);

const SPID_TESTENV_URL = process.env.SPID_TESTENV_URL;

// Register the spidStrategy.
export const IDP_METADATA_URL = getRequiredENVVar("IDP_METADATA_URL");
const CIE_METADATA_URL = getRequiredENVVar("CIE_METADATA_URL");

export const STARTUP_IDPS_METADATA: Record<string, string> | undefined = pipe(
  process.env.STARTUP_IDPS_METADATA,
  O.fromNullable,
  O.map(_ =>
    pipe(
      E.parseJSON(_, E.toError),
      E.chain(_1 =>
        pipe(
          _1,
          STRINGS_RECORD.decode,
          E.mapLeft(err => new Error(errorsToReadableMessages(err).join(" / ")))
        )
      ),
      E.getOrElseW(() => undefined)
    )
  ),
  O.getOrElseW(() => undefined)
);

export const CLIENT_ERROR_REDIRECTION_URL =
  process.env.CLIENT_ERROR_REDIRECTION_URL || "/error.html";

export const CLIENT_REDIRECTION_URL =
  process.env.CLIENT_REDIRECTION_URL || "/login";

const SPID_LEVEL_WHITELIST = pipe(
  process.env.SPID_LEVEL_WHITELIST,
  O.fromNullable,
  O.map(_ => _.split(",")),
  O.fold(
    // SPID_LEVEL_WHITELIST is unset
    () => {
      if (ENV === NodeEnvironmentEnum.DEVELOPMENT) {
        // default config for development, all the spid levels are allowed
        return E.right<t.Errors, SpidLevelArray>([
          "SpidL1",
          "SpidL2",
          "SpidL3"
        ]);
      }
      // default config for production, only L2 and L3 are allowed
      return E.right<t.Errors, SpidLevelArray>(["SpidL2", "SpidL3"]);
    },
    _ => SpidLevelArray.decode(_)
  ),
  E.getOrElseW(err => {
    log.error(
      "Invalid value for SPID_LEVEL_WHITELIST env [%s]",
      readableReport(err)
    );
    return process.exit(1);
  })
);

export const appConfig: IApplicationConfig = {
  assertionConsumerServicePath: "/assertionConsumerService",
  clientErrorRedirectionUrl: CLIENT_ERROR_REDIRECTION_URL,
  clientLoginRedirectionUrl: CLIENT_REDIRECTION_URL,
  loginPath: "/login",
  metadataPath: "/metadata",
  sloPath: "/slo",
  spidLevelsWhitelist: SPID_LEVEL_WHITELIST,
  startupIdpsMetadata: STARTUP_IDPS_METADATA
};

const maybeSpidValidatorUrlOption = pipe(
  process.env.SPID_VALIDATOR_URL,
  O.fromNullable,
  O.map(_ => ({ [_]: true }))
);
const maybeSpidTestenvOption = pipe(
  SPID_TESTENV_URL,
  O.fromNullable,
  O.map(_ => ({
    [_]: true
  }))
);

// Set default idp metadata refresh time to 7 days
export const DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS = 3600 * 24 * 7;
export const IDP_METADATA_REFRESH_INTERVAL_SECONDS: number = process.env
  .IDP_METADATA_REFRESH_INTERVAL_SECONDS
  ? parseInt(process.env.IDP_METADATA_REFRESH_INTERVAL_SECONDS, 10)
  : DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS;
log.info(
  "IDP metadata refresh interval set to %s seconds",
  IDP_METADATA_REFRESH_INTERVAL_SECONDS
);

// LolliPoP protocol configuration params
export const DEFAULT_LOLLIPOP_ASSERTION_REF_DURATION = (3600 *
  24 *
  365 *
  2) as Second; // 2y default assertionRef duration on redis cache

// Spid/Cie Service Provider Config.
export const serviceProviderConfig: IServiceProviderConfig = {
  IDPMetadataUrl: IDP_METADATA_URL,
  organization: {
    URL: "https://io.italia.it",
    displayName: "IO - l'app dei servizi pubblici BETA",
    name: "PagoPA S.p.A."
  },
  publicCert: samlCert(),
  requiredAttributes: {
    attributes: ["email", "name", "familyName", "fiscalNumber", "dateOfBirth"],
    name: "IO - l'app dei servizi pubblici BETA"
  },
  spidCieUrl: CIE_METADATA_URL,
  spidTestEnvUrl: SPID_TESTENV_URL,
  spidValidatorUrl: process.env.SPID_VALIDATOR_URL,
  strictResponseValidation: {
    ...(O.isSome(maybeSpidTestenvOption) ? maybeSpidTestenvOption.value : {}),
    ...(O.isSome(maybeSpidValidatorUrlOption)
      ? maybeSpidValidatorUrlOption.value
      : {})
  }
};

export const samlConfig: SamlConfig = {
  RACComparison: "minimum",
  acceptedClockSkewMs: SAML_ACCEPTED_CLOCK_SKEW_MS,
  attributeConsumingServiceIndex: SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX,
  // this value is dynamic and taken from query string
  authnContext: "https://www.spid.gov.it/SpidL1",
  callbackUrl: SAML_CALLBACK_URL,
  identifierFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  issuer: SAML_ISSUER,
  logoutCallbackUrl: SAML_LOGOUT_CALLBACK_URL,
  privateCert: samlKey(),
  requestIdExpirationPeriodMs: SAML_REQUEST_EXPIRATION_PERIOD_MS
};

// Redirection urls
export const clientProfileRedirectionUrl =
  process.env.CLIENT_REDIRECTION_URL || "/profile.html?token={token}";

if (!clientProfileRedirectionUrl.includes("{token}")) {
  log.error("CLIENT_REDIRECTION_URL must contains a {token} placeholder");
}

// IP(s) or CIDR(s) allowed for notification
export const ALLOW_NOTIFY_IP_SOURCE_RANGE = pipe(
  process.env.ALLOW_NOTIFY_IP_SOURCE_RANGE,
  decodeCIDRs,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid ALLOW_NOTIFY_IP_SOURCE_RANGE environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

// IP(s) or CIDR(s) allowed for payment manager endpoint
export const ALLOW_PAGOPA_IP_SOURCE_RANGE = pipe(
  process.env.ALLOW_PAGOPA_IP_SOURCE_RANGE,
  decodeCIDRs,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid ALLOW_PAGOPA_IP_SOURCE_RANGE environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

// IP(s) or CIDR(s) allowed for myportal endpoint
export const ALLOW_MYPORTAL_IP_SOURCE_RANGE = pipe(
  process.env.ALLOW_MYPORTAL_IP_SOURCE_RANGE,
  decodeCIDRs,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid ALLOW_MYPORTAL_IP_SOURCE_RANGE environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

// IP(s) or CIDR(s) allowed for bpd endpoint
export const ALLOW_BPD_IP_SOURCE_RANGE = pipe(
  process.env.ALLOW_BPD_IP_SOURCE_RANGE,
  decodeCIDRs,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid ALLOW_BPD_IP_SOURCE_RANGE environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

// IP(s) or CIDR(s) allowed for zendesk endpoint
export const ALLOW_ZENDESK_IP_SOURCE_RANGE = pipe(
  process.env.ALLOW_ZENDESK_IP_SOURCE_RANGE,
  decodeCIDRs,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid ALLOW_ZENDESK_IP_SOURCE_RANGE environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

// IP(s) or CIDR(s) allowed for handling sessions
export const ALLOW_SESSION_HANDLER_IP_SOURCE_RANGE = pipe(
  process.env.ALLOW_SESSION_HANDLER_IP_SOURCE_RANGE,
  decodeCIDRs,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid ALLOW_SESSION_HANDLER_IP_SOURCE_RANGE environment variable: ${readableReport(
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

const bearerAuthFetch = (
  origFetch: typeof fetch = fetch,
  bearerToken: string
): typeof fetch => (input: RequestInfo, init: RequestInit | undefined) =>
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
export const IO_SIGN_API_BASE_PATH = getRequiredENVVar("IO_SIGN_API_BASE_PATH");
export const IO_SIGN_API_CLIENT = IoSignAPIClient(
  IO_SIGN_API_KEY,
  IO_SIGN_API_URL,
  IO_SIGN_API_BASE_PATH,
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

export const FF_LOLLIPOP_ENABLED = process.env.FF_LOLLIPOP_ENABLED === "1";
export const LOLLIPOP_REVOKE_STORAGE_CONNECTION_STRING = getRequiredENVVar(
  "LOLLIPOP_REVOKE_STORAGE_CONNECTION_STRING"
);
export const LOLLIPOP_REVOKE_QUEUE_NAME = getRequiredENVVar(
  "LOLLIPOP_REVOKE_QUEUE_NAME"
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

// TODO: Add configurations to the First lollipop consumer from ENVs
export const FIRST_LOLLIPOP_CONSUMER_CLIENT = FirstLollipopConsumerClient(
  "",
  "",
  "secret"
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

export const EUCOVIDCERT_API_KEY = getRequiredENVVar("EUCOVIDCERT_API_KEY");
export const EUCOVIDCERT_API_URL = getRequiredENVVar("EUCOVIDCERT_API_URL");
export const EUCOVIDCERT_API_BASE_PATH = getRequiredENVVar(
  "EUCOVIDCERT_API_BASE_PATH"
);
export const EUCOVIDCERT_API_CLIENT = EUCovidCertAPIClient(
  EUCOVIDCERT_API_KEY,
  EUCOVIDCERT_API_URL,
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
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid PN Address book configuration envs: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

export const PN_ADDRESS_BOOK_CLIENT_SELECTOR: O.Option<ReturnType<
  typeof PNClientFactory
>> = pipe(
  PNAddressBookConfig,
  E.fromPredicate(IEnabledPnAddressBookConfig.is, () => O.none),
  E.map(pnConfig =>
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

export const MIT_VOUCHER_API_BASE_PATH = getRequiredENVVar(
  "MIT_VOUCHER_API_BASE_PATH"
);

// Set default session duration to 30 days
const DEFAULT_TOKEN_DURATION_IN_SECONDS = 3600 * 24 * 30;
export const tokenDurationSecs: number = process.env.TOKEN_DURATION_IN_SECONDS
  ? parseInt(process.env.TOKEN_DURATION_IN_SECONDS, 10)
  : DEFAULT_TOKEN_DURATION_IN_SECONDS;
log.info("Session token duration set to %s seconds", tokenDurationSecs);

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

// API endpoint mount.
export const AUTHENTICATION_BASE_PATH = getRequiredENVVar(
  "AUTHENTICATION_BASE_PATH"
);
export const PAGOPA_BASE_PATH = getRequiredENVVar("PAGOPA_BASE_PATH");

export const MYPORTAL_BASE_PATH = getRequiredENVVar("MYPORTAL_BASE_PATH");

export const BPD_BASE_PATH = getRequiredENVVar("BPD_BASE_PATH");

export const FIMS_BASE_PATH = getRequiredENVVar("FIMS_BASE_PATH");

export const ZENDESK_BASE_PATH = getRequiredENVVar("ZENDESK_BASE_PATH");

// Token needed to receive API calls (notifications, metadata update) from io-functions-services
export const PRE_SHARED_KEY = getRequiredENVVar("PRE_SHARED_KEY");

// Register the urlTokenStrategy.
export const URL_TOKEN_STRATEGY = urlTokenStrategy(PRE_SHARED_KEY);

export const getClientProfileRedirectionUrl = (token: string): UrlFromString =>
  pipe(
    clientProfileRedirectionUrl.replace("{token}", token),
    UrlFromString.decode,
    E.getOrElseW(() => {
      throw new Error("Invalid url");
    })
  );

export const ClientErrorRedirectionUrlParams = t.union([
  t.intersection([
    t.interface({
      errorMessage: NonEmptyString
    }),
    t.partial({
      errorCode: t.number
    })
  ]),
  t.intersection([
    t.partial({
      errorMessage: NonEmptyString
    }),
    t.interface({
      errorCode: t.number
    })
  ]),
  t.interface({
    errorCode: t.number,
    errorMessage: NonEmptyString
  })
]);
export type ClientErrorRedirectionUrlParams = t.TypeOf<
  typeof ClientErrorRedirectionUrlParams
>;

export const getClientErrorRedirectionUrl = (
  params: ClientErrorRedirectionUrlParams
): UrlFromString =>
  pipe(
    record
      .collect(S.Ord)((key, value) => `${key}=${value}`)(params)
      .join("&"),
    errorParams => CLIENT_ERROR_REDIRECTION_URL.concat(`?${errorParams}`),
    UrlFromString.decode,
    E.getOrElseW(() => {
      throw new Error("Invalid url");
    })
  );

// Needed to forward SPID requests for logging
export const SPID_LOG_STORAGE_CONNECTION_STRING = getRequiredENVVar(
  "SPID_LOG_STORAGE_CONNECTION_STRING"
);
export const SPID_LOG_QUEUE_NAME = getRequiredENVVar("SPID_LOG_QUEUE_NAME");

// Needed to forward SPID/CIE successful login
export const USERS_LOGIN_STORAGE_CONNECTION_STRING = getRequiredENVVar(
  "USERS_LOGIN_STORAGE_CONNECTION_STRING"
);
export const USERS_LOGIN_QUEUE_NAME = getRequiredENVVar(
  "USERS_LOGIN_QUEUE_NAME"
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

// Push notifications
export const NOTIFICATION_DEFAULT_SUBJECT =
  "Entra nell'app per leggere il contenuto";
export const NOTIFICATION_DEFAULT_TITLE = "Hai un nuovo messaggio su IO";

export const BARCODE_ALGORITHM = pipe(
  process.env.BARCODE_ALGORITHM,
  NonEmptyString.decode,
  E.getOrElse(() => "code128" as NonEmptyString)
);

// Application insights sampling percentage
export const DEFAULT_APPINSIGHTS_SAMPLING_PERCENTAGE = 5;

// Password login params
export const TEST_LOGIN_FISCAL_CODES = pipe(
  process.env.TEST_LOGIN_FISCAL_CODES,
  NonEmptyString.decode,
  E.map(_ => _.split(",")),
  E.map(_ => A.rights(_.map(FiscalCode.decode))),
  E.getOrElseW(() => [])
);

export const TEST_LOGIN_PASSWORD = NonEmptyString.decode(
  process.env.TEST_LOGIN_PASSWORD
);

// Feature flags
export const FF_BONUS_ENABLED = process.env.FF_BONUS_ENABLED === "1";
export const FF_CGN_ENABLED = process.env.FF_CGN_ENABLED === "1";
export const FF_IO_SIGN_ENABLED = process.env.FF_IO_SIGN_ENABLED === "1";
export const FF_EUCOVIDCERT_ENABLED =
  process.env.FF_EUCOVIDCERT_ENABLED === "1";

export const FF_MIT_VOUCHER_ENABLED =
  process.env.FF_MIT_VOUCHER_ENABLED === "1";

export const FF_USER_AGE_LIMIT_ENABLED =
  process.env.FF_USER_AGE_LIMIT_ENABLED === "1";

// Support Token
export const JWT_SUPPORT_TOKEN_PRIVATE_RSA_KEY = pipe(
  process.env.JWT_SUPPORT_TOKEN_PRIVATE_RSA_KEY,
  NonEmptyString.decode,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid JWT_SUPPORT_TOKEN_PRIVATE_RSA_KEY environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);
export const JWT_SUPPORT_TOKEN_ISSUER = pipe(
  process.env.JWT_SUPPORT_TOKEN_ISSUER,
  NonEmptyString.decode,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid JWT_SUPPORT_TOKEN_ISSUER environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

const DEFAULT_JWT_SUPPORT_TOKEN_EXPIRATION = 604800 as Second;
export const JWT_SUPPORT_TOKEN_EXPIRATION: Second = pipe(
  process.env.JWT_SUPPORT_TOKEN_EXPIRATION,
  IntegerFromString.decode,
  E.getOrElseW(() => DEFAULT_JWT_SUPPORT_TOKEN_EXPIRATION)
) as Second;

log.info(
  "JWT support token expiration set to %s seconds",
  JWT_SUPPORT_TOKEN_EXPIRATION
);

// Zendesk support Token
export const JWT_ZENDESK_SUPPORT_TOKEN_SECRET = pipe(
  process.env.JWT_ZENDESK_SUPPORT_TOKEN_SECRET,
  NonEmptyString.decode,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid JWT_ZENDESK_SUPPORT_TOKEN_SECRET environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);
export const JWT_ZENDESK_SUPPORT_TOKEN_ISSUER = pipe(
  process.env.JWT_ZENDESK_SUPPORT_TOKEN_ISSUER,
  NonEmptyString.decode,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid JWT_ZENDESK_SUPPORT_TOKEN_ISSUER environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

const DEFAULT_JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION = 604800 as Second;
export const JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION: Second = pipe(
  process.env.JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION,
  IntegerFromString.decode,
  E.getOrElseW(() => DEFAULT_JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION)
) as Second;

log.info(
  "JWT Zendesk support token expiration set to %s seconds",
  JWT_ZENDESK_SUPPORT_TOKEN_EXPIRATION
);

// Mit  Voucher Token
export const JWT_MIT_VOUCHER_TOKEN_PRIVATE_ES_KEY = pipe(
  process.env.JWT_MIT_VOUCHER_TOKEN_PRIVATE_ES_KEY,
  NonEmptyString.decode,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid JWT_MIT_VOUCHER_TOKEN_PRIVATE_ES_KEY environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);
export const JWT_MIT_VOUCHER_TOKEN_ISSUER = pipe(
  process.env.JWT_MIT_VOUCHER_TOKEN_ISSUER,
  NonEmptyString.decode,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid JWT_MIT_VOUCHER_TOKEN_ISSUER environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

const DEFAULT_JWT_MIT_VOUCHER_TOKEN_EXPIRATION = 600 as Second;
export const JWT_MIT_VOUCHER_TOKEN_EXPIRATION: Second = pipe(
  process.env.JWT_MIT_VOUCHER_TOKEN_EXPIRATION,
  IntegerFromString.decode,
  E.getOrElseW(() => DEFAULT_JWT_MIT_VOUCHER_TOKEN_EXPIRATION)
) as Second;

log.info(
  "JWT Mit Voucher expiration set to %s seconds",
  JWT_MIT_VOUCHER_TOKEN_EXPIRATION
);

export const JWT_MIT_VOUCHER_TOKEN_AUDIENCE = pipe(
  process.env.JWT_MIT_VOUCHER_TOKEN_AUDIENCE,
  NonEmptyString.decode,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid JWT_MIT_VOUCHER_TOKEN_AUDIENCE environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

export const TEST_CGN_FISCAL_CODES = pipe(
  process.env.TEST_CGN_FISCAL_CODES || "",
  CommaSeparatedListOf(FiscalCode).decode,
  E.getOrElseW(err => {
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
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid PECSERVERS environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);
//

export const THIRD_PARTY_CONFIG_LIST = pipe(
  process.env.THIRD_PARTY_CONFIG_LIST ?? "",
  ThirdPartyConfigListFromString.decode,
  E.getOrElse(() => [] as ThirdPartyConfigListFromString)
);

// -------------------------------
// FF Appbackendli
// -------------------------------

// Enable /notify and session/:fiscal_code/lock endpoint
// only if code is deployed on appbackendli

const IS_APPBACKENDLI = pipe(
  O.fromNullable(process.env.IS_APPBACKENDLI),
  O.map(val => val.toLowerCase() === "true"),
  O.getOrElse(() => false)
);

export const FF_ENABLE_NOTIFY_ENDPOINT = IS_APPBACKENDLI;
export const FF_ENABLE_SESSION_ENDPOINTS = IS_APPBACKENDLI;

// PN Service Id
export const PN_SERVICE_ID = pipe(
  process.env.PN_SERVICE_ID,
  NonEmptyString.decode,
  E.getOrElseW(errs => {
    log.error(
      `Missing or invalid PN_SERVICE_ID environment variable: ${readableReport(
        errs
      )}`
    );
    return process.exit(1);
  })
);

export const FF_ROUTING_PUSH_NOTIF = pipe(
  process.env.FF_ROUTING_PUSH_NOTIF,
  FeatureFlag.decode,
  E.getOrElse(_ => FeatureFlagEnum.NONE)
);

export const FF_ROUTING_PUSH_NOTIF_BETA_TESTER_SHA_LIST = pipe(
  process.env.FF_ROUTING_PUSH_NOTIF_BETA_TESTER_SHA_LIST,
  CommaSeparatedListOf(NonEmptyString).decode,
  E.getOrElseW(errs => {
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
  E.getOrElse(_ => "XYZ" as NonEmptyString)
);
