FROM node:9-alpine

ENV NODE_ENV=production

RUN mkdir -p /usr/src/app
COPY .git /usr/src/app/.git
COPY common /usr/src/app/common
COPY server /usr/src/app/server

WORKDIR /usr/src/app
RUN apk add --no-cache git && \
    echo $(git rev-parse HEAD) >> VERSION && \
    echo $(git name-rev --tags --name-only $(git rev-parse HEAD)) >> VERSION && \
    echo $(git describe --tags HEAD) >> VERSION && \
    echo $(git show -s --format=%s) >> VERSION && \
    echo $(git show -s --format=%ci) >> VERSION && \
    cat VERSION && \
    rm -rf .git && \
    apk del git

WORKDIR /usr/src/app/common
RUN yarn install

WORKDIR /usr/src/app/server
RUN yarn install && \
    yarn add apidoc && \
    yarn run apidoc && \
    yarn remove apidoc && \
    yarn cache clean && \
    ls -l apidoc/index.html

CMD ["node", "src/start.js"]
