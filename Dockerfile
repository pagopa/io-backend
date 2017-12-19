ARG NODE_VER

FROM node:${NODE_VER}

EXPOSE 8080

COPY /app/node_modules /usr/src/app/node_modules
COPY /app/.babelrc /usr/src/app/.babelrc
COPY /app/package.json /usr/src/app/package.json
COPY /app/src /usr/src/app/src

WORKDIR /usr/src/app

CMD ["yarn", "start"]
