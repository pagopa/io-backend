#!/usr/bin/env bash

docker run --rm --network="italia-backend_default" -v "$PWD/spid-batch-import:/usr/src/app" -v "$PWD/certs:/certs" -e "NODE_ENV=development" -w "/usr/src/app" node:8.9.4-alpine /usr/src/app/import.sh
