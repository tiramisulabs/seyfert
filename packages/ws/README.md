
# biscuit

## A brand new bleeding edge non bloated Discord library

<img align="right" src="https://raw.githubusercontent.com/oasisjs/biscuit/main/assets/icon.svg" alt="biscuit"/>

## Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @biscuitland/ws
yarn add @biscuitland/ws
```

for further reading join our [Discord](https://discord.gg/zqtPgyaFpV)

## Most importantly, biscuit's ws is:
A standalone gateway to interface Discord, it is meant to be used with a rest manager to send fetch requests to Discord

## Example (GW proxy)
```ts
import { DefaultWsAdapter } from "@biscuitland/ws";
import { DefaultRestAdapter } from "@biscuitland/rest";
import { GATEWAY_BOT, GatewayIntents } from "@biscuitland/api-types";

const intents = GatewayIntents.Guilds | GatewayIntents.GuildMessages | GatewayIntents.MessageContent;

const restManager = new DefaultRestAdapter({
    url: "http://localhost:port..."
    token: "your token goes here",
    version: 10,
});

const config = await restManager.get("/gateway/bot").then(res => ({
    url: res.url,
    shards: res.shards,
    sessionStartLimit: {
        total: res.session_start_limit.total,
        remaining: res.session_start_limit.remaining,
        resetAfter: res.session_start_limit.reset_after,
        maxConcurrency: res.session_start_limit.max_concurrency,
    },
});

const wsManager = new DefaultWsAdapter({
    gatewayConfig: {
        token: "your token goes here",
        intents: intents,
    },
    handleDiscordPayload(shard, data) {
        if (!data.t) return;

        await fetch("http://localhost:port...", {
            method: "POST",
            body: JSON.stringify({ shardId: shard.id, data: data }),
        })
        .then(res => res.text())
        .catch(err => null);
    },
});

wsManager.options.gatewayBot = config;
wsManager.options.lastShardId = wsManager.options.gatewayBot.shards - 1;
wsManager.options.totalShards = wsManager.options.gatewayBot.shards;
wsManager.agent.options.totalShards = wsManager.options.gatewayBot.shards;

// start a quick bot
wsManager.shards();
```
