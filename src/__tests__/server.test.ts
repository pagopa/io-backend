// tslint:disable-next-line: no-object-mutation
process.env = {
  ...process.env,
  ALLOW_NOTIFY_IP_SOURCE_RANGE: "::ffff:ac13:1/112",
  ALLOW_PAGOPA_IP_SOURCE_RANGE: "::ffff:ac13:1/112",
  API_BASE_PATH: "/api/v1",
  API_KEY: "put_your_api_key_here",
  API_URL: "http://functions:7071/api/v1",
  AUTHENTICATION_BASE_PATH: "",
  AZURE_NH_ENDPOINT:
    "Endpoint=sb:// io-lab-notification-hub-ns.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=C4xIzNZv4VrUnu5jkmPH635MApRUj8wABky8VfdPLqg=",
  AZURE_NH_HUB_NAME: "put_nh_hub_name_here",
  AzureWebJobsStorage:
    // tslint:disable-next-line: no-duplicate-string
    "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://fnstorage:10000/devstoreaccount1;QueueEndpoint=http:// fnstorage:10001/devstoreaccount1;TableEndpoint=http://fnstorage:10002/devstoreaccount1;",
  CIE_METADATA_URL:
    "https://idserver.servizicie.interno.gov.it:8443/idp/shibboleth",
  CLIENT_ERROR_REDIRECTION_URL: "/error.html",
  CLIENT_REDIRECTION_URL: "/profile.html?token:",
  IDP_METADATA_URL:
    "https://registry.spid.gov.it/metadata/idp/spid-entities-idps.xml",
  LogsStorageConnection:
    "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://fnstorage:10000/devstoreaccount1;QueueEndpoint=http:// fnstorage:10001/devstoreaccount1;TableEndpoint=http://fnstorage:10002/devstoreaccount1;",
  PAGOPA_API_URL: "https://pagopa-proxy",
  PAGOPA_API_URL_PROD: "https://pagopa-proxy",
  PAGOPA_BASE_PATH: "/pagopa/api/v1",
  PORT: "80",
  PRE_SHARED_KEY: "12345",
  REDIS_PASSWORD: "put_the_azure_redis_password_here",
  REDIS_PORT: "put_the_azure_redis_port_here",
  REDIS_URL: "put_the_azure_redis_url_here",
  SAML_ACCEPTED_CLOCK_SKEW_MS: "0",
  SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX: "0",
  SAML_CALLBACK_URL: "https://italia-backend/assertionConsumerService",
  SAML_ISSUER: "https:// spid.agid.gov.it/cd",
  SHUTDOWN_SIGNALS: "SIGINT SIGTERM",
  SHUTDOWN_TIMEOUT_MILLIS: "30000",
  SPID_AUTOLOGIN: "lussoluca",
  SPID_LOG_QUEUE_NAME: "spidmsgitems",
  SPID_LOG_STORAGE_CONNECTION_STRING:
    "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://fnstorage:10000/devstoreaccount1;QueueEndpoint=http:// fnstorage:10001/devstoreaccount1;TableEndpoint=http://fnstorage:10002/devstoreaccount1;",
  SPID_TESTENV_URL: "https://spid-testenv2:8088",
  TOKEN_DURATION_IN_SECONDS: "3600"
};

import { Express } from "express";
import * as http from "http";

import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";

import { newApp } from "../app";
import { initHttpGracefulShutdown } from "../utils/gracefulShutdown";

jest.mock("@azure/storage-queue");

const aValidCIDR = "192.168.0.0/16" as CIDR;
jest.mock("../services/notificationService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({}))
  };
});

describe("Server graceful shutdown", () => {
  // tslint:disable:no-let
  let app: Express;
  const finallyMock = jest.fn();

  const gracefulShutdownTimeout = 2000;
  const port = 9999;

  jest.spyOn(process, "exit").mockImplementation(() => true as never);

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useRealTimers();
    app = await newApp(
      NodeEnvironmentEnum.DEVELOPMENT,
      [aValidCIDR],
      [aValidCIDR],
      "",
      "/api/v1",
      "/pagopa/api/v1"
    );

    const server = http.createServer(app);
    server.listen(port);

    initHttpGracefulShutdown(server, app, {
      development: false,
      finally: finallyMock,
      signals: "SIGTERM SIGINT",
      timeout: gracefulShutdownTimeout
    });
  });

  afterAll(() => {
    jest.useFakeTimers();
    jest.runAllTimers();
    app.emit("server:stop");
  });

  it("should call finally functions in HttpGracefulShutdown two times", async () => {
    process.emit("SIGTERM", "SIGTERM");
    setTimeout(() => {
      expect(finallyMock).toHaveBeenCalled();
    }, gracefulShutdownTimeout);
  });
});
