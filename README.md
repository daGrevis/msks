# msks-client & msks-server

[Meeseeks](https://www.youtube.com/watch?v=qUYvIAP3qQk) displays IRC messages in web browser. Demo at [developers.lv](https://developers.lv/).

Messages are stored in RethinkDB by [msks-bot](https://github.com/daGrevis/msks-bot). Then they are pushed to React client via Socket.IO.

## Development

Make sure RethinkDB and [msks-bot](https://github.com/daGrevis/msks-bot) are running.

Install environment:

```sh
yarn install
```

Start server:

```sh
yarn run start:server
```

Start client:

```sh
yarn run start:client
```

Go to [`localhost:3000`](http://localhost:3000/).
