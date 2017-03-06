FROM node:7.6-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN yarn install

CMD [ "yarn", "run", "start" ]
