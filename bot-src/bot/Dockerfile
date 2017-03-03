FROM node:7.6-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

RUN apk add --no-cache --virtual curl && \
  apk add --no-cache --virtual git && \
  mkdir -p /opt && \
  echo $(git rev-parse HEAD) >> VERSION && \
  echo $(git name-rev --tags --name-only $(git rev-parse HEAD)) >> VERSION && \
  echo $(git show -s --format=%s) >> VERSION && \
  echo $(git show -s --format=%ci) >> VERSION

RUN yarn install

CMD ["yarn", "run", "start"]
