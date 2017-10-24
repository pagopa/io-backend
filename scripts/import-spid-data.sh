#!/usr/bin/env bash

docker run --rm --network="italiabackend_default" -v "$PWD/spid-batch-import:/usr/src/app" -e "NODE_ENV=development" -w "/usr/src/app" node:8.6.0-alpine /usr/src/app/import.sh
