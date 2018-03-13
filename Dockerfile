FROM node:8.9.4-alpine as builder

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

WORKDIR /usr/src/app

COPY /package.json /usr/src/app/package.json
COPY /yarn.lock /usr/src/app/yarn.lock

RUN yarn install \
  && yarn build

FROM node:8.9.4-alpine
LABEL maintainer="https://teamdigitale.governo.it"

WORKDIR /usr/src/app

COPY /package.json /usr/src/app/package.json
COPY /src /usr/src/app/src
COPY /public /usr/src/app/public
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules

EXPOSE 80

CMD ["yarn", "start"]
