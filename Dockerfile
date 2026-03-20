FROM node:22.22.0@sha256:20a424ecd1d2064a44e12fe287bf3dae443aab31dc5e0c0cb6c74bef9c78911c as builder

WORKDIR /usr/src/app

COPY / /usr/src/app/

RUN yarn install \
  && yarn predeploy

FROM node:22.22.0-alpine@sha256:e4bf2a82ad0a4037d28035ae71529873c069b13eb0455466ae0bc13363826e34
LABEL maintainer="https://pagopa.gov.it"

# Install major CA certificates to cover
# https://github.com/SparebankenVest/azure-key-vault-to-kubernetes integration
RUN apk --no-cache add ca-certificates

WORKDIR /usr/src/app

COPY /package.json /usr/src/app/package.json
COPY /public /usr/src/app/public
COPY --from=builder /usr/src/app/dist /usr/src/app/dist
COPY --from=builder /usr/src/app/openapi /usr/src/app/openapi
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules

EXPOSE 80

CMD ["node", "dist/src/server.js"]
