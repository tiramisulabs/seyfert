# @biscuitland/ws

## Advice

This version of @biscuitland/ws is a completely @discordjs/ws "fork" with some minor changes, like compression being removed. All credits for this go to the Discord.js team.

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

## Example (GW proxy)

```ts
import { WebSocketManager, type WebSocketShardEvents } from '@biscuitland/ws';
import { BiscuitREST } from '@biscuitland/rest';
import { GatewayIntentBits } from 'discord-api-types/v10';

const intents = GatewayIntentBits.Guilds;
const token = 'your token goes here';
const rest = new BiscuitREST().setToken(token);

// gateway bot code ↓
const ws = new WebSocketManager({ token, intents, rest });

ws.on(WebSocketShardEvents.Ready, (ready) => {
	console.log(`Logged as ${ready.user.username}`);
});

await ws.connect();
```

## Links

- [Website](https://biscuitjs.com/)
- [Documentation](https://docs.biscuitjs.com/)
- [Discord](https://discord.gg/XNw2RZFzaP)
- [core](https://www.npmjs.com/package/@biscuitland/core) | [api-types](https://www.npmjs.com/package/@biscuitland/api-types) | [cache](https://www.npmjs.com/package/@biscuitland/cache) | [rest](https://www.npmjs.com/package/@biscuitland/rest) | [helpers](https://www.npmjs.com/package/@biscuitland/helpers)
