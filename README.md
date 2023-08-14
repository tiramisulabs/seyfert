# biscuit

## A brand new bleeding edge non bloated Discord library

<img align="right" src="https://raw.githubusercontent.com/oasisjs/biscuit/main/assets/icon.svg" alt="biscuit"/>

## Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @biscuitland/core
yarn add @biscuitland/core
```

for further reading join our [Discord](https://discord.com/invite/XNw2RZFzaP)

## Most importantly, biscuit:
Stands apart from other libraries like Discord.js or Eris as it takes a conscious and dedicated approach, adhering strictly to [simplicity](https://en.wikipedia.org/wiki/Unix_philosophy). We have examined the features and functionalities that contribute to [bloat](https://en.wikipedia.org/wiki/Code_bloat) in libraries, intentionally removing unnecessary complexities we deliver a [minimalistic](https://en.wikipedia.org/wiki/Minimalism_(computing)) and efficient solution that includes only essential components for Discord API interaction, reducing the library's footprint and enabling scalability.

High RAM usage in other libraries often arises due to unnecessary features and functionalities and suboptimal caching mechanisms tied to the core library.

### Leveraging the power of meta programming
The Proxy object enables dynamic, flexible and efficient calls to the API, it is typesafe due to TypeScript wizardry, meta programming is not for the weak minded.

## Why biscuit?:
- Remarkably minimal memory footprint
- Scalable
- Non feature-rich!

## Example bot (TS/JS)

```ts
import { Session } from '@biscuitland/core';
import { GatewayIntentBits, InteractionType, InteractionResponseType } from '@biscuitland/common';

const session = new Session({
  intents: GatewayIntentBits.Guilds,
  token: 'your token goes here'
});

const commands = [
  {
    name: 'ping',
    description: 'Replies with pong!'
  }
];

session.once('READY', (payload) => {
  const username = payload.user.username;
  console.log('Logged in as: %s', username);
  session.managers.applications.bulkCommands(session.applicationId, commands);
});

session.on('INTERACTION_CREATE', (interaction) => {
  if (interaction.type !== InteractionType.ApplicationCommand) return;
  session.managers.interactions.reply(interaction.id, interaction.token, {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: { content: 'pong!' }
  });
});

session.start();
```

## Links
* [Website](https://biscuitjs.com/)
* [Documentation](https://docs.biscuitjs.com/)
* [Discord](https://discord.gg/XNw2RZFzaP)
* [core](https://www.npmjs.com/package/@biscuitland/core) | [rest](https://www.npmjs.com/package/@biscuitland/rest) | [ws](https://www.npmjs.com/package/@biscuitland/ws) | [helpers](https://www.npmjs.com/package/@biscuitland/helpers)
