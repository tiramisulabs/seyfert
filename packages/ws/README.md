# @biscuitland/ws
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
import { ShardManager } from '@biscuitland/ws';
import { DefaultRestAdapter } from '@biscuitland/rest';
import { GatewayIntents } from '@biscuitland/api-types';
import type { DiscordGetGatewayBot, DiscordReady } from '@biscuitland/api-types';

const intents = GatewayIntents.Guilds;
const token = 'your token goes here';
const rest = new DefaultRestAdapter({ token });

const gateway = await rest.get<DiscordGetGatewayBot>('/gateway/bot');

// gateway bot code ↓
const ws = new ShardManager({
    gateway,
    config: { intents, token },
    handleDiscordPayload(shard, payload) {
        if (payload.t === "READY") {
            const data = payload.d as DiscordReady;
            console.log("logged in as:", data.user.username);
            console.log("shard: %d", shard.options.id);
        }
    },
});

await ws.spawns();
```

## Links
* [Website](https://biscuitjs.com/)
* [Documentation](https://docs.biscuitjs.com/)
* [Discord](https://discord.gg/XNw2RZFzaP) 
* [core](https://www.npmjs.com/package/@biscuitland/core) | [api-types](https://www.npmjs.com/package/@biscuitland/api-types) | [cache](https://www.npmjs.com/package/@biscuitland/cache) | [rest](https://www.npmjs.com/package/@biscuitland/rest) | [helpers](https://www.npmjs.com/package/@biscuitland/helpers)
