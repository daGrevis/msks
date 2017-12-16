# msks

[Meeseeks](https://www.youtube.com/watch?v=qUYvIAP3qQk) displays IRC messages in web browser. Demo at [developers.lv](https://developers.lv/).

Messages are stored in RethinkDB. Then they are pushed to React client via Socket.IO.

## Development

It's easy to run your own msks and start coding me features!

### Node

Make sure you have recent version of [Node.js](https://nodejs.org/). To manage multiple versions of `node`, try [`nvm`](https://github.com/creationix/nvm).

### Yarn

Make sure you have [`yarn`](https://yarnpkg.com/en/docs/install) installed for package management.

Install dependencies of both codebases by going to `server/` & `client/` respectively and running `yarn`.

### RethinkDB & Elasticsearch

Msks server requires [RethinkDB](https://www.rethinkdb.com/) & [Elasticsearch](https://www.elastic.co/). I'm using [Docker](https://www.docker.com/) containers for that, but that's not a requirement.

    docker run -d --name msks-rethink -p 28015:28015 -p 8080:8080 rethinkdb

    docker run -d --name msks-elastic -p 9200:9200 -e "http.host=0.0.0.0" -e "transport.host=127.0.0.1" docker.elastic.co/elasticsearch/elasticsearch-oss:6.1.0

### Configuration

Copy `config.example.toml` to `config.toml`. Default config should be good enough to get your msks up and running.

### Run Server

From `server/`, run `yarn run start`. This starts HTTP server and IRC chatbot.

### Run Client

From `client/`, run `yarn run start`. This starts `webpack` watcher and static server.
