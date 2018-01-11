#!/usr/bin/env bash

docker run --rm -v "$PWD/app:/usr/src/app" -e "NODE_ENV=development" -w "/usr/src/app" node:8.9.4-alpine yarn test
