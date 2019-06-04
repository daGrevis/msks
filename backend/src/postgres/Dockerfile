FROM postgres:10-alpine

RUN apk add --no-cache git make gcc g++ curl-dev && \
  git clone --depth 1 --branch v10-1.0.3 https://github.com/zombodb/zombodb.git && \
  cd zombodb && \
  make install && \
  cd .. && \
  rm -rf zombodb && \
  apk del git make gcc g++
