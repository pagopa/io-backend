#!/usr/bin/env bash

docker run --rm -v "$PWD/app:/usr/src/app" -e "NODE_ENV=development" -w "/usr/src/app" italia-backend/tools:1.0.0 yarn test
