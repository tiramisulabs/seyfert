# @biscuitland/rest
## Most importantly, biscuit's rest is:
A standalone rest library that is yet easy to use and easy to host on a serverless infrastructure, it is meant to be used with biscuit's libraries.

[<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/oasisjs/biscuit)
[<img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">](https://discord.gg/XNw2RZFzaP)

<img align="right" src="https://raw.githubusercontent.com/oasisjs/biscuit/main/assets/icon.svg" alt="biscuit"/>

## Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @biscuitland/rest
yarn add @biscuitland/rest
```

## Example (Standalone rest)
```ts
import { DefaultRestAdapter } from "@biscuitland/rest";
import Fastify from "fastify";

const manager = new DefaultRestAdapter({
    url: "http://localhost:port...",
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

## Links
* [Website](https://biscuitjs.com/)
* [Documentation](https://docs.biscuitjs.com/)
* [Discord](https://discord.gg/XNw2RZFzaP) 
* [core](https://www.npmjs.com/package/@biscuitland/core) | [api-types](https://www.npmjs.com/package/@biscuitland/api-types) | [cache](https://www.npmjs.com/package/@biscuitland/cache) | [ws](https://www.npmjs.com/package/@biscuitland/ws) | [helpers](https://www.npmjs.com/package/@biscuitland/helpers)