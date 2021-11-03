FROM circleci/node:10.14.2 as builder

RUN sudo apt-get -y install --no-install-recommends libunwind8=1.1-4.1

WORKDIR /usr/src/app

COPY /src /usr/src/app/src
COPY /package.json /usr/src/app/package.json
COPY /tsconfig.json /usr/src/app/tsconfig.json
COPY /yarn.lock /usr/src/app/yarn.lock
COPY /api_notifications.yaml /usr/src/app/api_notifications.yaml
COPY /notification_queue_messages.yaml /usr/src/app/notification_queue_messages.yaml
COPY /api_backend.yaml /usr/src/app/api_backend.yaml
COPY /api_pagopa.yaml /usr/src/app/api_pagopa.yaml
COPY /api_public.yaml /usr/src/app/api_public.yaml
COPY /api_bonus.yaml /usr/src/app/api_bonus.yaml
COPY /api_session.yaml /usr/src/app/api_session.yaml
COPY /api_myportal.yaml /usr/src/app/api_myportal.yaml
COPY /api_bpd.yaml /usr/src/app/api_bpd.yaml
COPY /api_cgn.yaml /usr/src/app/api_cgn.yaml
COPY /api_eucovidcert.yaml /usr/src/app/api_eucovidcert.yaml
COPY /api_mit_voucher.yaml /usr/src/app/api_mit_voucher.yaml
COPY /api_auth.yaml /usr/src/app/api_auth.yaml


COPY /.npmrc /usr/src/app/.npmrc
RUN sudo chmod -R 777 /usr/src/app \
  && yarn install \
  && yarn generate:proxy-models \
  && yarn build

FROM node:10.14.2-alpine
LABEL maintainer="https://pagopa.gov.it"

# Install major CA certificates to cover
# https://github.com/SparebankenVest/azure-key-vault-to-kubernetes integration
RUN apk --no-cache add ca-certificates

WORKDIR /usr/src/app

COPY /package.json /usr/src/app/package.json
COPY /public /usr/src/app/public
COPY --from=builder /usr/src/app/src /usr/src/app/src
COPY --from=builder /usr/src/app/generated /usr/src/app/generated
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules

EXPOSE 80

CMD ["node", "src/server.js"]
