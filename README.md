[![Azure DevOps](https://dev.azure.com/pagopa-io/io-backend/_apis/build/status/pagopa.io-backend)](https://dev.azure.com/pagopa-io/io-backend/_build?definitionId=8&_a=summary)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/455c43c16c574e248e68c7e4effaf614)](https://www.codacy.com/app/cloudify/io-backend?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=pagopa/io-backend&amp;utm_campaign=Badge_Grade)

[![codecov](https://codecov.io/gh/pagopa/io-backend/branch/master/graph/badge.svg)](https://codecov.io/gh/pagopa/io-backend)

# IO mobile backend

This repository contains the code of the backend used by the
[mobile](https://github.com/pagopa/io-app) applications of the [IO project](https://io.italia.it).

## Table of content

- [IO mobile backend](#io-mobile-backend)
  - [Table of content](#table-of-content)
  - [What is this?](#what-is-this)
  - [Authentication process](#authentication-process)
    - [Token authentication](#token-authentication)
  - [How to run the application](#how-to-run-the-application)
    - [Dependencies](#dependencies)
    - [Installation steps](#installation-steps)
    - [Container description](#container-description)
    - [Environment variables](#environment-variables)
    - [Logs](#logs)
  - [API Monitoring](#api-monitoring)
  - [Redis Database](#redis-database)
    - [Data Structure](#data-structure)
  - [Mobile App compatibility](#mobile-app-compatibility)
    - [Backend](#backend)
    - [PagoPa](#pagopa)
  - [How to contribute](#how-to-contribute)
    - [Dependencies](#dependencies-1)
    - [Starting steps](#starting-steps)
    - [Architecture decision records](#architecture-decision-records)
  - [Troubleshooting](#troubleshooting)

---

## What is this?

This is the backend that supports the [io-app](https://github.com/pagopa/io-app)
mobile application.

This project is part of the Italian Digital Citizenship initiative, see the
[main repository](https://github.com/pagopa/io) for further information.

## Authentication process

The `io-app` application will authenticate using the APIs exposed by the service `Session Manager` in [IO Auth monorepo](https://github.com/pagopa/io-auth-n-identity-domain).

Once the token is obtained it can be used to call authenticated APIs of this repository.

### Token authentication

All API requests sent by the client to the backend must have an `Authorization: Bearer` header with the value of the
token obtained from the SPID authentication process. The token is used to retrieve the User object from the
`SessionStorage` service.

The code that manage this flow are in the `src/strategies/bearerSessionTokenStrategy.ts` file.

## How to run the application

### Dependencies

* [Docker](https://www.docker.com/) and [Docker Compose](https://github.com/docker/compose)

A Linux/macOS environment is required at the moment.

### Installation steps

1. clone the project in a folder called `io-backend`
2. go to the project's folder
3. install dependencies with `yarn install`
4. generate proxy models with `yarn generate`
5. build the project with `yarn build`
6. run `scripts/generate-test-certs.sh` to create certificates needed to start the HTTPS server in DEV mode
7. edit your `/etc/hosts` file by adding:

    ```
    127.0.0.1    io-backend
    ```

8. copy `.env.example` to `.env` and fill the variables with your values
9. run `docker compose --env-file .env up -d` to start the containers
10.  point your browser to [https://io-backend/info](https://io-backend/info) to check that the server is started

If you are using Docker with a Docker Machine replace `localhost` with the IP of the Docker Machine
([More details here](https://docs.docker.com/machine/reference/ip/)).

### Container description

* `backend`: the backend Node application that serves the web and mobile applications

Nginx is reachable at [https://io-backend]() \

### Environment variables

Those are all Environment variables needed by the application:

| Variable name                             | Description                                                                                          | type   |
|----------------------------------------   |------------------------------------------------------------------------------------------------------|--------|
| API_KEY                                   | The key used to authenticate to the io-functions-app API                                             | string |
| API_URL                                   | The io-functions-app URL                                                                             | string |
| API_BASE_PATH                             | The root path for the backend api endpoints                                                          | string |
| BONUS_API_KEY                             | The key used to authenticate to the io-functions-bonus API                                           | string |
| BONUS_API_URL                             | The io-functions-bonus  URL                                                                          | string |
| BONUS_API_BASE_PATH                       | The root path for the backend bonus api endpoints                                                    | string |
| CGN_API_KEY                               | The key used to authenticate to the io-functions-cgn API                                             | string |
| CGN_API_URL                               | The io-functions-cgn  URL                                                                            | string |
| CGN_API_BASE_PATH                         | The root path for the backend cgn api endpoints                                                      | string |
| PORT                                      | The HTTP port the Express server is listening to                                                     | int    |
| REDIS_URL                                 | The URL of a Redis instance                                                                          | string |
| PRE_SHARED_KEY                            | The key shared with the API backend to authenticate the webhook notifications                        | string |
| ALLOW_NOTIFY_IP_SOURCE_RANGE              | The range in CIDR form of allowed IPs for the webhook notifications                                  | string |
| NOTIFICATIONS_STORAGE_CONNECTION_STRING   | Connection string to Azure queue storage for notification hub messages                               | string |
| NOTIFICATIONS_QUEUE_NAME                  | Queue name of Azure queue storage for notification hub messages                                      | string |
| ALLOW_SESSION_HANDLER_IP_SOURCE_RANGE     | The range in CIDR form of IPs of service allowed to handle user sessions                             | string |
| AUTHENTICATION_BASE_PATH                  | The root path for the authentication endpoints                                                       | string |
| PAGOPA_API_URL_PROD                       | The url for the PagoPA api endpoints in prod mode                                                    | string |
| PAGOPA_API_KEY_PROD                       | The api-key needed to call the pagopa proxy API                                                      | string |
| PAGOPA_API_URL_TEST                       | The url for the PagoPA api endpoints in test mode                                                    | string |
| PAGOPA_API_KEY_UAT                        | The api-key needed to call the pagopa proxy API for UAT instance                                     | string |
| CACHE_MAX_AGE_SECONDS                     | The value in seconds for duration of in-memory api cache                                             | int    |
| APICACHE_DEBUG                            | When is `true` enable the apicache debug mode                                                        | boolean |
| GITHUB_TOKEN                              | The value of your Github Api Key, used in build phase                                                | string |
| FETCH_KEEPALIVE_ENABLED                   | When is `true` enables `keepalive` agent in the API client (defaults to `false`)                     | boolean |
| FETCH_KEEPALIVE_MAX_SOCKETS               | (Optional) See [agentkeepalive](https://github.com/node-modules/agentkeepalive#readme)               | |
| FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT_MS    | (Optional) See [agentkeepalive](https://github.com/node-modules/agentkeepalive#readme)               | |
| FETCH_KEEPALIVE_KEEPALIVE_MSECS           | (Optional) See [agentkeepalive](https://github.com/node-modules/agentkeepalive#readme)               | |
| FETCH_KEEPALIVE_MAX_FREE_SOCKETS          | (Optional) See [agentkeepalive](https://github.com/node-modules/agentkeepalive#readme)               | |
| FETCH_KEEPALIVE_TIMEOUT                   | (Optional) See [agentkeepalive](https://github.com/node-modules/agentkeepalive#readme)               | |
| FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL         | (Optional) See [agentkeepalive](https://github.com/node-modules/agentkeepalive#readme)               | |
| FF_CGN_ENABLED                            | When is `true` (namely `1`) enables CGN API to be registered into backend app                        | boolean |
| FF_CGN_ENABLED                            | When is `true` (namely `1`) enables CGN API to be registered into backend app                        | boolean |
| APP_MESSAGES_API_KEY                      | The key used to authenticate to the io-functions-app-messages API                                    | string |
| APP_MESSAGES_API_URL                      | The io-functions-app-messages URL                                                                    | string |
| THIRD_PARTY_CONFIG_LIST                   | (Optional, default empty) A list of ThirdParty Configuration                                         | stringified JSON |
| IS_APPBACKENDLI                           | (Optional, default false) Enables notify and session lock endpoints working only on appbackendli     | boolean |
| FF_PN_ACTIVATION_ENABLED                  | (Optional) Enable the integration with PN for Service Activation (1 enabled)                         | int     |
| PN_ACTIVATION_BASE_PATH                   | (Required if FF_PN_ACTIVATION_ENABLED = 1) base path for activation endpoint                         | string  |
| PN_API_KEY                                | (Required if FF_PN_ACTIVATION_ENABLED = 1) PN API key for production environment                     | string  |
| PN_API_KEY_UAT                            | (Required if FF_PN_ACTIVATION_ENABLED = 1) PN API key for UAT environment                            | string  |
| PN_API_URL                                | (Required if FF_PN_ACTIVATION_ENABLED = 1) PN API base url for production                            | string  |
| PN_API_URL_UAT                            | (Required if FF_PN_ACTIVATION_ENABLED = 1) PN API base url for UAT environment                       | string  |
| FF_IO_SIGN_ENABLED                        | When is `true` (namely `1`) enables IO SIGN API to be registered into backend app                    | boolean |
| IO_SIGN_API_BASE_PATH                     | The root path for the backend io-sign api endpoints                                                  | string  |
| IO_SIGN_API_KEY                           | The key used to authenticate to the io-func-sign-user API                                            | string  |
| IO_SIGN_API_URL                           | The io-func-sign-user  URL                                                                           | string  |
| LOLLIPOP_API_KEY                          | The key used to authenticate to the io-function-lollipop API                                         | string  |
| LOLLIPOP_API_URL                          | The io-function-lollipop URL                                                                         | string  |
| LOLLIPOP_API_BASE_PATH                    | The io-function-lollipop api base path                                                               | string  |
| LOLLIPOP_REVOKE_STORAGE_CONNECTION_STRING | Connection string to Azure queue storage for revoke Users lollipop PubKeys                           | string  |
| LOLLIPOP_REVOKE_QUEUE_NAME                | Queue name of Azure queue storage for revoke Users lollipop PubKeys                                  | string  |
| LOCKED_PROFILES_STORAGE_CONNECTION_STRING | Connection string to Azure queue storage for locked profiles table                                   | string |
| LOCKED_PROFILES_TABLE_NAME                | The locked profiles table name                                                                       | string |
| FF_UNIQUE_EMAIL_ENFORCEMENT               | (Optional) Enable the unique email enforcement policy. Default: NONE                                 | string (enum: NONE, BETA, ALL) |
| UNIQUE_EMAIL_ENFORCEMENT_USERS            | (Optional) Comma separated list of UNIQUE_EMAIL_ENFORCEMENT beta testers. Default: empty array       | string |
| SERVICES_APP_BACKEND_BASE_PATH            | New Service APIs(include search engine) basepath                                                     | string |
| SERVICES_APP_BACKEND_API_URL              | Services App Backend FunctionApp Url                                                                 | string |
| SERVICES_APP_BACKEND_API_BASE_PATH        | Services App Backend FunctionApp Api Basepath                                                        | string |
| FF_TRIAL_SYSTEM_ENABLED                   | (Optional) enables Trial System API to be registered into backend app - default false                | string |
| TRIAL_SYSTEM_API_BASE_PATH                | Trial System Api Base path                                                                           | string |
| TRIAL_SYSTEM_API_URL                      | Trial System FunctionApp Api url                                                                     | string |
| TRIAL_SYSTEM_API_KEY                      | The key used to authenticate to the Trial System API                                                 | string |

Notes:
 * `FETCH_KEEPALIVE_ENABLED` should be enabled when deploying on Azure App Service to avoid [SNAT Exhaustion](https://docs.microsoft.com/en-us/azure/load-balancer/load-balancer-outbound-connections)
 * `FETCH_KEEPALIVE_MAX_SOCKETS` depends on the number of `node` processes running on the VM, see [this article](https://docs.microsoft.com/en-us/azure/app-service/app-service-web-nodejs-best-practices-and-troubleshoot-guide#my-node-application-is-making-excessive-outbound-calls) and [this issue](https://github.com/MicrosoftDocs/azure-docs/issues/8013)
 * `FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL` should be set at around 100 seconds when deploying on Azure, see [this comment](https://github.com/MicrosoftDocs/azure-docs/issues/29600#issuecomment-490354812)

If you are trying to run the docker images on your local environment (through the docker-compose) you must set the following variables:
  * NOTIFICATIONS_STORAGE_CONNECTION_STRING
  * PUSH_NOTIFICATIONS_STORAGE_CONNECTION_STRING
  * LOLLIPOP_REVOKE_STORAGE_CONNECTION_STRING
With this **connection string** as value:
  * DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:20003/devstoreaccount1;QueueEndpoint=http://127.0.0.1:20004/devstoreaccount1;TableEndpoint=http://127.0.0.1:20005/devstoreaccount1;

The **connection string** has a default value needed to connect to Azurite, a local emulator used to provide a free local environment for testing an Azure Blob, Queue Storage, and Table Storage application.
As for docker-compose instructions, the Azurite docker image runs the Blob service on port 20003, the Queue service on port 20004 and the Table service on port 20005. If Azurite is executed on different address or ports, the **connection string** must be changed according to the service.

You must also set the following variables:
 * REDIS_URL
 * REDIS_PORT
 * REDIS_PASSWORD

With the same values defined in the docker-compose.yml file.

### Logs

Application logs are saved into the logs folder.

---

## API Monitoring

Is possible link the API to AppInsignts service by setting the ENV variable `APPINSIGHTS_CONNECTION_STRING`. Stats of API CPU and RAM usage, API call execution time, success or failure of API calls are collected.
Realtime data collection is enabled.

## Redis Database

### Data Structure

Redis Database stores data required only by application side functionalities. Below a table with an example of data for an hypothetical user with fiscal code `MRARSS80A01H501T` and with session token `HexToken`.


| Key                          | Value                                                              | type   | expire in |
|----------------------------------------|-----------------------------------------------------------------------------------|--------|-----------|
| SESSION-HexToken       | a JSON representing the user object | `User` | TOKEN_DURATION_IN_SECONDS |
| WALLET-WalletHexToken   | `"SESSION-HexToken"` | `String` | TOKEN_DURATION_IN_SECONDS |
| SESSIONINFO-HexToken   | a JSON representing the `SessionInfo` object | `SessionInfo` | TOKEN_DURATION_IN_SECONDS |
| USERSESSIONS-MRARSS80A01H501T | a Set of SessionInfo Keys | `Set<SessionInfoKey>` | never |

## Mobile App compatibility

### Backend

To handle Backend compatibility with several Mobile App versions, the oldest mobile app version supported by the backend is stored into the property `min_app_version` inside the `package.json`. This value is provided to the app through the `/info` API.
If the mobile app version is lower an upgrade is required.

### PagoPa

To handle the mobile app compatibility with the latest implementation of PagoPA APIs, the backend exposes through the `/info` API a property called `min_app_version_pagopa` defined into `package.json` file. If the mobile app version is lower of this value, all the functions that require PagoPa are disabled to avoid compatibility issues.

## How to contribute

### Dependencies

* [nodenv](https://github.com/nodenv/nodenv)
* [YARN](https://yarnpkg.com/)
* [Docker](https://www.docker.com/community-edition) (optional)

A Linux/macOS environment is required at the moment.

### Starting steps

* use `nodenv` to run the correct version of Nodejs as specified in `app/.node-version`
* run Jest tests directly or with `scripts/test.sh`

In general follow the [Node Best Practices](https://devcenter.heroku.com/articles/node-best-practices).

### Architecture decision records

In a world of evolutionary architecture, it's important to record certain design decisions for the benefit of future
team members as well as for external oversight. Architecture Decision Records is a technique for capturing important
architectural decisions along with their context and consequences. We store these details in source control, along with
code, as then they can provide a record that remains in sync with the code itself.

We use
[ADR](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions)s to track architectural decisions of
this initiative.

This repository is configured for Nat Pryce's [_adr-tools_](https://github.com/npryce/adr-tools).

Here's the decisions we taken so far:

| ADR | Title                                                                                                                             | PR (discussion)    |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | [Record architecture decisions](doc/architecture/decisions/0001-record-architecture-decisions.md)                                 |                    |
| 2   | [Backend runs on Docker on local environments](doc/architecture/decisions/0002-backend-runs-on-docker-on-local-environments.md)   |                    |
| 3   | [Use OpenAPI to defined the API specs](doc/architecture/decisions/0003-use-openapi-to-defined-the-api-specs.md)                   |                    |
| 4   | [Use a dependency injection container](doc/architecture/decisions/0004-use-a-dependency-injection-container.md)                   |                    |
| 5   | [Use a GUID as Installation ID](doc/architecture/decisions/0005-use-a-guid-as-installation-id.md)                                 |                    |
| 6   | [Backend is deployed on more than one instance](doc/architecture/decisions/0006-backend-is-deployed-on-more-than-one-instance.md) |                    |

---

## Troubleshooting

**I installed on my mac but seems that https://io-backend is not working (ping io-backend return a host error)**

Check out /etc/hosts
Remember that in some cases you need to use your docker-machine ip (get it from >docker-machine ip) instead of
localhost.

**I followed all the steps but when i go to https://io-backend it shows me the same as https://io-backend:8080**

This problem seems to be dependent on how Docker for Mac (doesn't) manage well the /etc/hosts file. If you install
Docker Toolbox it works fine (and can [coexist](https://docs.docker.com/docker-for-mac/docker-toolbox/#setting-up-to-run-docker-for-mac))
(Read more at [https://medium.com/@itseranga/set-hosts-in-docker-for-mac-2029276fd448](https://medium.com/@itseranga/set-hosts-in-docker-for-mac-2029276fd448))
