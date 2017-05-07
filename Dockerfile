FROM node:7.6-alpine

RUN mkdir -p /usr/src/app
COPY common /usr/src/app/common
COPY server /usr/src/app/server

WORKDIR /usr/src/app/common
RUN yarn install

WORKDIR /usr/src/app/server
RUN yarn install

ENV NODE_ENV=production

CMD yarn start
