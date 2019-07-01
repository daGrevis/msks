FROM node:12-alpine

ENV NODE_ENV=production

RUN mkdir -p /usr/src/app
COPY .git /usr/src/app/.git
COPY backend /usr/src/app

WORKDIR /usr/src/app
RUN apk add --no-cache git && \
    # rev
    echo $(git rev-parse HEAD) >> VERSION && \
    # latestTag
    echo $(git describe --tags --abbrev=0) >> VERSION && \
    # commitCount
    echo $(git log --oneline $(git describe --abbrev=0 --tags)..HEAD | wc -l | awk '{ print $1 }') >> VERSION && \
    # subject
    echo $(git show -s --format=%s) >> VERSION && \
    # date
    echo $(git show -s --format=%ci) >> VERSION && \
    echo '<VERSION>' && \
    cat VERSION && \
    echo '</VERSION>' && \
    rm -rf .git && \
    apk del git

WORKDIR /usr/src/app
RUN yarn install && \
    yarn cache clean

# Can't use yarn start because https://github.com/yarnpkg/yarn/issues/4667
CMD ["node", "src/index.js"]
