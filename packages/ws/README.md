# @biscuitland/ws

## Advice

This version of @biscuitland/ws is a **fork** of @discordeno/gateway, all credits go to them. However it has been heavily modified for proper use within biscuit.

## Most importantly, biscuit's ws is:

A standalone gateway to interface Discord, it is meant to be used with a rest manager to send fetch requests to Discord

[<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/oasisjs/biscuit)
[<img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">](https://discord.gg/XNw2RZFzaP)

<img align="right" src="https://raw.githubusercontent.com/oasisjs/biscuit/main/assets/icon.svg" alt="biscuit"/>

## Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @biscuitland/ws
yarn add @biscuitland/ws
```

## Example

```ts
import { ShardManager } from "@biscuitland/ws";
import { BiscuitREST, Router } from "@biscuitland/rest";
import { GatewayIntentBits } from "@biscuitland/common";

const intents = GatewayIntentBits.Guilds;
const token = "your token goes here";
const rest = new BiscuitREST({ token });
const api = new Router(rest).createProxy();

(async () => {
  const connection = await api.gateway.bot.get();

  // gateway bot code ↓
  const ws = new ShardManager({
    token,
    intents,
    connection,
    async handlePayload(shardId, payload) {
      console.log("Received payload on shard #%s", shardId, payload);
    },
  });

  await ws.spawnShards();
})();
```

## Links
* [Website](https://biscuitjs.com/)
* [Documentation](https://docs.biscuitjs.com/)
* [Discord](https://discord.gg/XNw2RZFzaP) 
* [rest](https://www.npmjs.com/package/@biscuitland/rest) | [core](https://www.npmjs.com/package/@biscuitland/core) | [helpers](https://www.npmjs.com/package/@biscuitland/helpers)
