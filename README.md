[![Codacy Badge](https://api.codacy.com/project/badge/Grade/455c43c16c574e248e68c7e4effaf614)](https://www.codacy.com/app/cloudify/italia-backend?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=teamdigitale/italia-backend&amp;utm_campaign=Badge_Grade)

[![dependencies](https://david-dm.org/teamdigitale/italia-backend/status.svg)](https://david-dm.org/teamdigitale/italia-backend)

# Digital citizenship web and mobile backend

## How to run the application

### Dependencies

* [Docker](https://www.docker.com/) and [Docker Compose](https://github.com/docker/compose)

### Steps

* clone the project
* go to the project's folder
* run `scripts/yarn.sh` to do a Yarn install
* run `docker-compose up`
* point your browser to http://localhost:80

If you are using Docker with a Docker Machine replace localhost with the IP of the Docker Machine. 

## How to contribute

### Dependencies

* [nodenv](https://github.com/nodenv/nodenv)
* [YARN](https://yarnpkg.com/)
* [flow](https://flow.org) and [flow-typed](https://github.com/flowtype/flow-typed/blob/master/README.md)

### Steps

* use nodenv to run the correct version of Nodejs as specified in app/.node-version
* configure your IDE to use flow and ESLint
* run Jest tests directly or with `scripts/test.sh` 

In general follow the [Node Best Practices](https://devcenter.heroku.com/articles/node-best-practices).
