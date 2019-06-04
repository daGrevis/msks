FROM node:12-alpine

ENV NODE_ENV=production

RUN mkdir -p /usr/src/app
COPY .git /usr/src/app/.git
COPY backend /usr/src/app

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

WORKDIR /usr/src/app
RUN yarn install && \
    yarn cache clean

# Can't use yarn start because https://github.com/yarnpkg/yarn/issues/4667
CMD ["node", "src/index.js"]
