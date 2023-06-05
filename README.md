# biscuit

## A brand new bleeding edge non bloated Discord library

<img align="right" src="https://raw.githubusercontent.com/oasisjs/biscuit/main/assets/icon.svg" alt="biscuit"/>

## Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @biscuitland/core
yarn add @biscuitland/core
```

for further reading join our [Discord](https://discord.com/invite/XNw2RZFzaP)

## Most importantly, biscuit is:

- A wrapper to interface the Discord API
- A bleeding edge library

Biscuit is primarily inspired by Discord.js and Discordeno but it does not include a cache layer by default, we believe
that you should not make software that does things it is not supposed to do.

## Why biscuit?:

- [Minimal](https://en.wikipedia.org/wiki/Unix_philosophy), non feature-rich!
- Scalable

## Example bot (TS/JS)

```js
import { Session } from '@biscuitland/core';
import { GatewayIntentBits, InteractionType, InteractionResponseType } from '@biscuitland/common';

const session = new Session({
    intents: GatewayIntentBits,
    token: 'your token goes here'
});

const commands = [{
    name: 'ping',
    description: 'Replies with pong!'
}];

session.on('READY', (payload) => {
    const username = payload.user.username;
    console.log('I'm ready! logged in as %s', username);

    const [shardId, _shardCount] = payload.shard ?? [0, 0];

    if (shardId === 0) session.managers.application.bulkCommands(session.applicationId!, commands);
});

session.on('INTERACTION_CREATE', (interaction) => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    session.api.managers.interaction.reply(interaction.id, interaction.token, {
        body: {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: { content: 'pong!' }
        }
    });
});

session.start();
```

## Links
* [Website](https://biscuitjs.com/)
* [Documentation](https://docs.biscuitjs.com/)
* [Discord](https://discord.gg/XNw2RZFzaP)
* [core](https://www.npmjs.com/package/@biscuitland/core) | [api-types](https://www.npmjs.com/package/@biscuitland/api-types) | [cache](https://www.npmjs.com/package/@biscuitland/cache) | [rest](https://www.npmjs.com/package/@biscuitland/rest) | [ws](https://www.npmjs.com/package/@biscuitland/ws) | [helpers](https://www.npmjs.com/package/@biscuitland/helpers)

## Known issues:
- node18 is required to run the library, however --experimental-fetch flag should work on node16+
- redis cache (wip)
- no optimal way to deliver a webspec bun version to the registry (#50)
