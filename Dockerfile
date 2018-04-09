FROM circleci/node:8.9.4 as builder

RUN sudo apt-get -y install --no-install-recommends libunwind8=1.1-3.2

WORKDIR /usr/src/app

COPY /src /usr/src/app/src
COPY /package.json /usr/src/app/package.json
COPY /tsconfig.json /usr/src/app/tsconfig.json
COPY /yarn.lock /usr/src/app/yarn.lock

RUN sudo chmod -R 777 /usr/src/app \
  && yarn install \
  && yarn build \
  && yarn generate-api-client

FROM node:8.9.4-alpine
LABEL maintainer="https://teamdigitale.governo.it"

WORKDIR /usr/src/app

COPY /package.json /usr/src/app/package.json
COPY /public /usr/src/app/public
COPY --from=builder /usr/src/app/src /usr/src/app/src
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules

EXPOSE 80

CMD ["yarn", "start"]
