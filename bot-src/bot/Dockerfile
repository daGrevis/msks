FROM node:7-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

RUN apk add --no-cache --virtual git \
  # rev
  && echo $(git rev-parse HEAD) >> VERSION \
  # tag
  && echo $(git name-rev --tags --name-only $(git rev-parse HEAD)) >> VERSION \
  # subject
  && echo $(git show -s --format=%s) >> VERSION \
  # date
  && echo $(git show -s --format=%ci) >> VERSION

RUN npm install

CMD [ "npm", "start" ]
