# msks

Demo at [dagrev.is/msks](https://dagrev.is/msks) & [developers.lv](https://developers.lv/).

## Development

### Backend

Install dependencies by going to `backend/` and running `yarn`.

You will need Postgres with [ZomboDB](https://github.com/zombodb/zombodb) extension and Elasticsearch so, if you're into Docker, run `docker-compose -f docker-compose.development.yml up`.

You can connect to Postgres via `psql` by running `docker-compose -f docker-compose.development.yml run --rm postgres psql -h postgres -U postgres`.

From there, you will want to create database by running `CREATE DATABASE msks;`. You may exit `psql`.

Apply the latest database migrations by running `yarn knex migrate:latest`.

Optionally you can seed the database with development fixtures by running `yarn knex seed:run`.

Override config by creating `backend/config.toml`. See `backend/config.default.toml`.

Run `yarn dev` to develop server.

Backend is served to [`localhost:3001`](http://localhost:3001/).

### Frontend

Install dependencies by going to `frontend/` and running `yarn`.

Run `yarn dev` to develop frontend.

Frontend is served to [`localhost:3000`](http://localhost:3000/).

## Deployment

### Builds

Build `msks` by running `docker build -f backend/Dockerfile -t msks .` from project root.

Build `postgres` by running `docker build -t postgres .` from `backend/src/postgres`.

Build frontend by running `yarn build` from `frontend`.

Custom frontend build configurations:

    PUBLIC_URL=/msks REACT_APP_BASE_PATH=/msks/ REACT_APP_SOCKET_PATH='/msks/socket.io' yarn build
    REACT_APP_PUBLIC_EMBED_CHANNEL_NAME='#developerslv' REACT_APP_PUBLIC_EMBED_SERVER_ID='freenode' yarn build

### Config

See `backend/docker-compose.production.yml` & `backend/nginx.production.conf` for example configuration with `nginx`.

### Volumes

Create `~/msks` for `config.toml`, `build`, `elastic-data` & `postgres-data`.

### Database

Before starting `msks` container, create and migrate the database.

    docker-compose up --no-start
    docker-compose start elastic postgres
    docker-compose run --rm postgres psql -h postgres -U postgres
    # CREATE DATABASE msks;
    docker-compose run msks yarn knex migrate:latest

### Service

Start everything in background.

    docker-compose up -d

### Bits

This may or may not be required.

    chown -R 1000:1000 ~/msks/elastic-data
    sysctl -w vm.max_map_count=262144
