[![Codacy Badge](https://api.codacy.com/project/badge/Grade/455c43c16c574e248e68c7e4effaf614)](https://www.codacy.com/app/cloudify/italia-backend?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=teamdigitale/italia-backend&amp;utm_campaign=Badge_Grade)

[![dependencies](https://david-dm.org/teamdigitale/italia-backend/status.svg)](https://david-dm.org/teamdigitale/italia-backend)

# Digital citizenship web and mobile backend

This repository contains the code of the backend used by the [web](https://github.com/teamdigitale/italia-web) and
[mobile](https://github.com/teamdigitale/italia-app) applications of the Digital citizenship project.

## How to run the application

### Dependencies

* [Docker](https://www.docker.com/) and [Docker Compose](https://github.com/docker/compose)

To fully simulate the SPID authentication process we use the images provided by
[spid-testenv-backoffice](https://github.com/italia/spid-testenv-backoffice) and
[spid-testenv-identityserver](https://github.com/italia/spid-testenv-identityserver) projects.

A Linux/macOS environment is required at the moment.

### Steps

1. clone the project in a folder called italia-backend
2. go to the project's folder
3. run `scripts/yarn.sh` to install backend dependencies
4. run `docker-compose up -d` to start the containers
5. edit your `/etc/hosts` file by adding:

```
localhost    spid-testenv-identityserver
localhost    italia-backend
```

6. wait a couple of minutes to let the IDP start (or monitor the process in `logs/idp/wso2carbon.log`)
7. run `scripts/import-spid-data.sh` to configure the local IDP
8. copy `app/.env.example` to `app/.env` and fill the variables with your values
9. point your browser to [https://italia-backend](https://italia-backend)

If you are using Docker with a Docker Machine replace `localhost` with the IP of the Docker Machine
([More details here](https://docs.docker.com/machine/reference/ip/)).

### Container description

* `backend`: the backend Node application that serves the web and mobile applications
* `spid-testenv-identityserver`: the test IDP server
* `spid-testenv-backoffice`: simple configuration interface to manage the test IDP server

Nginx is reachable at [https://italia-backend:80]() \
IDP is reachable at [https://spid-testenv-identityserver:9443]() (user: `admin`, password: `admin`) \
IDP simple backoffice is reachable at [https://spid-testenv-identityserver:8080]()
 
### Logs

Application logs are saved into the logs folder.

### SPID user management

The setup procedure adds some test users to the test IDP server, the full list could be retrieved in
`spid-batch-import/spid-users.json`. To add more users connect to [https://spid-testenv-identityserver:8080]() and
navigate to: *service provider > Servizi registrati* and click on *Utenti*.

## How to contribute

### Dependencies

* [nodenv](https://github.com/nodenv/nodenv)
* [YARN](https://yarnpkg.com/)
* [flow](https://flow.org) and [flow-typed](https://github.com/flowtype/flow-typed/blob/master/README.md)

A Linux/macOS environment is required at the moment.

### Steps

* use `nodenv` to run the correct version of Nodejs as specified in `app/.node-version`
* configure your IDE to use flow and ESLint
* run Jest tests directly or with `scripts/test.sh` 

In general follow the [Node Best Practices](https://devcenter.heroku.com/articles/node-best-practices).

### Generate the API client

The API client is generated with the [AutoRest](https://github.com/Azure/autorest) tool, in case of API change you need
to regenerate the client code:

* download the latest API specs from [https://raw.githubusercontent.com/teamdigitale/digital-citizenship-functions/master/api/public_api_v1.yaml]
* install the [AutoRest](https://github.com/Azure/autorest) tool
* run the command `autorest --input-file=public_api_v1.yaml --nodejs --output-folder=app/src/api`
