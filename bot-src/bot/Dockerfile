FROM node:7-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

RUN apk add --no-cache --virtual curl git && \
  mkdir -p /opt && \
  curl -sL https://yarnpkg.com/latest.tar.gz | tar xz -C /opt && \
  mv /opt/dist /opt/yarn && \
  ln -s /opt/yarn/bin/yarn /usr/local/bin && \
  echo $(git rev-parse HEAD) >> VERSION && \
  echo $(git name-rev --tags --name-only $(git rev-parse HEAD)) >> VERSION && \
  echo $(git show -s --format=%s) >> VERSION && \
  echo $(git show -s --format=%ci) >> VERSION

RUN yarn install

CMD [ "npm", "start" ]
