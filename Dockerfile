FROM node:8.9.4-alpine as builder

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

COPY /app/package.json /usr/src/app/package.json
WORKDIR /usr/src/app
RUN yarn install

FROM node:8.9.4-alpine
LABEL maintainer="https://teamdigitale.governo.it"

WORKDIR /usr/src/app

COPY /app/.babelrc /usr/src/app/.babelrc
COPY /app/package.json /usr/src/app/package.json
COPY /app/src /usr/src/app/src
COPY /app/public /usr/src/app/public
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules

EXPOSE 443

CMD ["yarn", "start"]
