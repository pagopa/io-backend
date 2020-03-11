[![Azure DevOps](https://dev.azure.com/pagopa-io/io-backend/_apis/build/status/pagopa.io-backend)](https://dev.azure.com/pagopa-io/io-backend/_build?definitionId=8&_a=summary)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/455c43c16c574e248e68c7e4effaf614)](https://www.codacy.com/app/cloudify/italia-backend?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=teamdigitale/italia-backend&amp;utm_campaign=Badge_Grade)

[![codecov](https://codecov.io/gh/teamdigitale/italia-backend/branch/master/graph/badge.svg)](https://codecov.io/gh/teamdigitale/italia-backend)

[![dependencies](https://david-dm.org/teamdigitale/italia-backend/status.svg)](https://david-dm.org/teamdigitale/italia-backend)

[![Docker Build Status](https://img.shields.io/docker/build/teamdigitale/italia-backend.svg)](https://hub.docker.com/r/teamdigitale/italia-backend/)

[![Maintainability](https://api.codeclimate.com/v1/badges/cf23057136cac233c8b6/maintainability)](https://codeclimate.com/github/teamdigitale/italia-backend/maintainability)

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fteamdigitale%2Fitalia-backend.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fteamdigitale%2Fitalia-backend?ref=badge_shield)

# Digital citizenship web and mobile backend

This repository contains the code of the backend used by the [web](https://github.com/teamdigitale/italia-web) and
[mobile](https://github.com/teamdigitale/italia-app) applications of the Digital citizenship project.

## Table of content

- [What is this?](#what-is-this?)
- [How to run the application](#how-to-run-the-application)
    - [Dependencies](#dependencies)
    - [Installation steps](#installation-steps)
    - [Containers description](#container-description)
    - [Environment variables](#environment-variables)
    - [Logs](#logs)
    - [SPID user management](#spid-user-management)
- [Redis Database](#redis-database)
    - [Data Structure](#data-structure)
- [Mobile App compatibility](#mobile-app-compatibility)
- [How to contribute](#how-to-contribute)
    - [Dependencies](#dependencies)
    - [Starting steps](#starting-steps)
    - [Generate SAML (SPID) certs](#generate-saml-spid-certs-development)
    - [SAML (SPID) certs with ENV vars](#saml-spid-certs-with-env-vars)
    - [SPID Identity Providers Metadata](#spid-identity-providers-metadata)
    - [SPID Validator](#spid-validator)
- [Troubleshooting](#troubleshooting)

---

## What is this?

This is the backend that supports the [italia-app](https://github.com/teamdigitale/italia-app)
mobile application.

This project is part of the Italian Digital Citizenship initiative, see the
[main repository](https://github.com/teamdigitale/digital-citizenship) for further information.

## Authentication process

The `italia-app` application will authenticate to the backend in two steps:

  1. an initial user initiated SPID authentication process (SAML2 based)
     that identifies the user and, on success, triggers the creation of a new
     authentication session (associated to a session token)
  2. subsequent requests to the backend will be authenticated via a bearer session token

![authentication_process](doc/images/authentication_process.svg)

### User authentication

When a client (the mobile app or a browser) wants to login with the backend it will call the `/login` endpoint with the
IDP entityID as parameter in the query string. The backend will then builds an authorization URL and performs a redirect
to the chosen IDP. The authentication process will continue to the IDP website. If the authentication process ends with
success the IDP will redirect the client to an HTML page with a form that will auto-post itself to the
`/assertionConsumerService` endpoint with a SAMLResponse as an hidden field. The backend will parse and validate the
SAMLResponse to extract all the user attributes (fiscal code, first name, last name, email), then it will generates an
unique alphanumeric string as token and saves an User object to the `SessionStorage` service using the token as key.
Finally the backend will redirect the client to the value of the environment variable `CLIENT_REDIRECTION_URL` with the
token in the query string. The client must saves the token and use it in all API request.

The code that manage this flow are in the `spid-passport` package (more info
[here](https://github.com/italia/spid-passport)), and in the `src/strategies/spidStrategy.ts` and
`src/controllers/authenticationController.ts` files.

### Token authentication

All API requests sent by the client to the backend must have an `Authorization: Bearer` header with the value of the
token obtained from the SPID authentication process. The token is used to retrieve the User object from the
`SessionStorage` service.

The code that manage this flow are in the `src/strategies/bearerSessionTokenStrategy.ts` file.

## How to run the application

### Dependencies

* [Docker](https://www.docker.com/) and [Docker Compose](https://github.com/docker/compose)

To fully simulate the SPID authentication process we use the images provided by the
[spid-testenv2](https://github.com/italia/spid-testenv2) project.

A Linux/macOS environment is required at the moment.

### Installation steps

1. clone the project in a folder called `italia-backend`
2. go to the project's folder
3. run `scripts/build-tools.sh` to build the `tools` Docker image
4. run `scripts/yarn.sh` to install backend dependencies
5. run `scripts/generate-proxy-api-models.sh` to generate the models defined in api_proxy.yaml and api_notifications.yaml
6. run `scripts/build.sh` to compile the Typescript files
7. run `scripts/generate-test-certs-task.sh` to create SAML (SPID) certificates
8. run `docker-compose up -d` to start the containers
9. edit your `/etc/hosts` file by adding:

    ```
    127.0.0.1    spid-testenv2
    127.0.0.1    italia-backend
    ```

12. copy `.env.example` to `.env` and fill the variables with your values
13. point your browser to [https://italia-backend/metadata](https://italia-backend/metadata) and copy the source of the
    page to a new `testenv2/conf/sp_metadata.xml` file
15. run `docker-compose up -d` to restart the containers
16. point your browser to [https://italia-backend](https://italia-backend)

If you are using Docker with a Docker Machine replace `localhost` with the IP of the Docker Machine
([More details here](https://docs.docker.com/machine/reference/ip/)).

### Container description

* `backend`: the backend Node application that serves the web and mobile applications
* `spid-testenv2`: the test IDP server

Nginx is reachable at [https://italia-backend:80]() \
IDP is reachable at [https://spid-testenv2:8088]() \

### Environment variables

Those are all Environment variables needed by the application:

| Variable name                          | Description                                                                       | type   |
|----------------------------------------|-----------------------------------------------------------------------------------|--------|
| API_KEY                                | The key used to authenticate to the API backend                                   | string |
| API_URL                                | The API backend URL                                                               | string |
| CLIENT_REDIRECTION_URL                 | The path where the user will be redirected after a successful SPID login          | string |
| CLIENT_ERROR_REDIRECTION_URL           | The path where the user will be redirected when en error occurs during SPID login | string |
| PORT                                   | The HTTP port the Express server is listening to                                  | int    |
| REDIS_URL                              | The URL of a Redis instance                                                       | string |
| TOKEN_DURATION_IN_SECONDS              | The number of seconds a session token is considered valid                         | int    |
| SAML_CALLBACK_URL                      | The absolute URL of the assertion consumer service endpoint                       | string |
| SAML_ISSUER                            | The issuer id for this Service Provider                                           | string |
| SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX | The index in the attribute consumer list                                          | int    |
| SAML_KEY                               | Private Key used by SAML protocol                                                 | string |
| SAML_CERT                              | Certificate used by SAML protocol                                                 | string |
| PRE_SHARED_KEY                         | The key shared with the API backend to authenticate the webhook notifications     | string |
| ALLOW_NOTIFY_IP_SOURCE_RANGE           | The range in CIDR form of allowed IPs for the webhook notifications               | string |
| AZURE_NH_HUB_NAME                      | The hub name configured in the Azure Notification HUB                             | string |
| AZURE_NH_ENDPOINT                      | The endpoint URL configured in the Azure Notification HUB                         | string |
| ALLOW_PAGOPA_IP_SOURCE_RANGE           | The range in CIDR form of allowed IPs for the PagoPA API                          | string |
| AUTHENTICATION_BASE_PATH               | The root path for the authentication endpoints                                    | string |
| API_BASE_PATH                          | The root path for the api endpoints                                               | string |
| PAGOPA_API_URL                         | The url for the PagoPA api endpoints                                              | string |
| PAGOPA_API_URL_TEST                    | The url for the PagoPA api endpoints in test mode                                 | string |
| PAGOPA_BASE_PATH                       | The root path for the PagoPA endpoints                                            | string |
| SPID_AUTOLOGIN                         | The user used in the autologin feature, omit this to disable autologin            | string |
| STARTUP_IDPS_METADATA                  | Stringified JSON containing idps metadata `Record<string, string>`                | string |
| CIE_METADATA_URL                       | Url to download CIE metadata from                                                 | string |
| IDP_METADATA_URL                       | Url to download SPID IDPs metadata from                                           | string |
| SPID_VALIDATOR_URL                     | Url to SPID Validator                                                             | string |
| IDP_METADATA_REFRESH_INTERVAL_SECONDS  | The number of seconds when the IDPs Metadata are refreshed                        | int |
| CACHE_MAX_AGE_SECONDS                  | The value in seconds for duration of in-memory api cache                          | int |
| APICACHE_DEBUG                         | When is `true` enable the apicache debug mode                                     | boolean |
| ALLOW_MULTIPLE_SESSIONS                | When is `true` allow multiple sessions for an user (default `false`)              | boolean |
| GITHUB_TOKEN                           | The value of your Github Api Key, used in build phase  | string |

### Logs

Application logs are saved into the logs folder.

### SPID user management

The setup procedure adds some test users to the test IDP server, the full list could be retrieved in
`testenv2/conf/users.json`. To add more users simply add more items to this file and restart the `spid-testenv2`
container.

---

## API Monitoring

Is possible link the API to AppInsignts service by setting the ENV variable `APPINSIGHTS_INSTRUMENTATIONKEY`. Stats of API CPU and RAM usage, API call execution time, success or failure of API calls are collected.
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

### Generate SAML (SPID) certs (development)

The backend implements a SAML Service Provider - for authenticating the clients
it needs a certificate that you can generate with the following command
(you need to have `openssl` available in your path):

```
$ yarn generate:test-certs
```

### Generate SAML (SPID) certs (production)

For production, the SPID certificate must be generated with
the following command:

```
$ openssl req -x509 -nodes -sha256 -days 365 -newkey rsa:4096 -keyout key.pem -out cert.pem
```

Then, the key and the certificate must be stored in the
Kubernetes secrets:

```
$ kubectl create secret generic spid-cert --from-file=./cert.pem --from-file=./key.pem
```

### SAML (SPID) certs with ENV vars

The certificate and the secret key could be provided to the backend with two ENV variables:
- `SAML_KEY`
- `SAML_CERT`

if these variables are set `cert.pem` and `key.pem` are ignored.

### SPID Identity Providers Metadata

When backend starts, SPID login is configured with Identity Providers metadata fetched from remote URL. URLs are provided by the following Environment variables: `CIE_METADATA_URL` (CIE login) `IDP_METADATA_URL` (SPID login) and `SPID_TESTENV_URL` (SPID test environment). Before that the backend become ready a time consuming operation must be completed (fetching remote metadata).

The default values are explained into the following table

| ENV                                    | development                                                                 | production                                                       |
|----------------------------------------|-----------------------------------------------------------------------------|------------------------------------------------------------------|
| `IDP_METADATA_URL`                     | https://registry.spid.gov.it/metadata/idp/spid-entities-idps.xml            | https://registry.spid.gov.it/metadata/idp/spid-entities-idps.xml |
| `CIE_METADATA_URL`                     | https://idserver.servizicie.interno.gov.it:8443/idp/shibboleth              | https://idserver.servizicie.interno.gov.it/idp/shibboleth        |
| `SPID_TESTENV_URL`                     | https://spid-testenv2:8088                                                  | -                                                                |

On local development only spid-testenv2, executed with docker-compose, could be used to complete a SPID login.

On production, in order to reduce the startup time, another Environment variable could be provided  `STARTUP_IDPS_METADATA`. To set its value run: 
```bash
export STARTUP_IDPS_METADATA=`npx startup-idps-metadata --idp-metadata-url-env IDP_METADATA_URL --cie-metadata-url-env CIE_METADATA_URL`
```

### SPID Validator

If is needed SPID validation another available environment variable is `SPID_VALIDATOR_URL`. Valid values for `SPID_VALIDATOR_URL` are:

| ENV                                    | development                            | production                    |
|----------------------------------------|----------------------------------------|-------------------------------|
| `IDP_METADATA_URL`                     | http://spid-saml-check:8080            | https://validator.spid.gov.it |

Spid Validator is a tool that verify that the SPID implementation is compliant with the AGID specification.

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

**I installed on my mac but seems that https://italia-backend:80 is not working (ping italia-backend return a host error)**

Check out /etc/hosts
Remember that in some cases you need to use your docker-machine ip (get it from >docker-machine ip) instead of
localhost.

**I followed all the steps but when i go to https://italia-backend it shows me the same as https://italia-backend:8080**

This problem seems to be dependent on how Docker for Mac (doesn't) manage well the /etc/hosts file. If you install
Docker Toolbox it works fine (and can [coexist](https://docs.docker.com/docker-for-mac/docker-toolbox/#setting-up-to-run-docker-for-mac))
(Read more at [https://medium.com/@itseranga/set-hosts-in-docker-for-mac-2029276fd448](https://medium.com/@itseranga/set-hosts-in-docker-for-mac-2029276fd448))

## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fteamdigitale%2Fitalia-backend.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fteamdigitale%2Fitalia-backend?ref=badge_large)
