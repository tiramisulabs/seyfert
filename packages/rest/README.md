# biscuit

## A brand new bleeding edge non bloated Discord library

<img align="right" src="https://raw.githubusercontent.com/oasisjs/biscuit/main/assets/icon.svg" alt="biscuit"/>

## Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @biscuitland/rest
yarn add @biscuitland/rest
```

for further reading join our [Discord](https://discord.gg/zmuvzzEFz2)

## Most importantly, biscuit's rest is:
A standalone rest library that is yet easy to use and easy to host on a serverless infrastructure, it is meant to be used with biscuit's libraries.

## Example
```ts
import { DefaultRestAdapter } from "@biscuitland/rest";
import Fastify from "fastify";

const manager = new DefaultRestAdapter({
    url: `http://localhost:port...`,
    token: "your token goes here",
    version: 10,
});

const app = Fastify({});

app.all("*", (req, reply) => {
    let response: unknown;

    switch (req.method) {
    case "GET":
        response = await rest.get(req.url, req.body);
    break;
    case "POST":
        response = await rest.post(req.url, req.body);
    break;
    case "PUT":
        response = await rest.put(req.url, req.body);
    break;
    case "PATCH":
        response = await rest.patch(req.url, req.body);
    break;
    case "DELETE":
        response = await rest.delete(req.url, req.body);
    break;
    }

    if (response)
        reply.status(200).send({ status: 200, data: response });

    else
        reply.status(204).send({ status: 204, data: null });
});

app.listen({ port: "port..." });
```

This package can be delivered through [unpkg](https://unpkg.com/) however is not tested yet
