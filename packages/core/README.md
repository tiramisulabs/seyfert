# @biscuitland/core
[<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/oasisjs/biscuit)
[<img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">](https://discord.gg/XNw2RZFzaP)

Classes, functions and main structures to create an application with biscuit. Core contains the essentials to launch you to develop your own customized and scalable bot.

## Getting Started

### Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @biscuitland/core
yarn add @biscuitland/core
```

### Example bot
`project/index.js`:
```js
import { ChatInputApplicationCommandBuilder, Session } from '@biscuitland/core';
import { GatewayIntents } from '@biscuitland/api-types';

const session = new Session({ token: 'your token', intents: GatewayIntents.Guilds });

const commands = [
    new ChatInputApplicationCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong!')
        .toJSON()
]

session.events.on('ready', async ({ user }) => {
    console.log('Logged in as:', user.username);
    await session.upsertApplicationCommands(commands, 'GUILD_ID');
});

session.events.on('interactionCreate', (interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'ping') {
            interaction.respond({ with: { content: 'pong!' } });
        }
    }
});

session.start();
```

### Execute
For node 18.+:
```
B:\project> node index.js
```

For node 16.+:
```
B:\project> node --experimental-fetch index.js
```

## Links
* [Website](https://biscuitjs.com/)
* [Documentation](https://docs.biscuitjs.com/)
* [Discord](https://discord.gg/XNw2RZFzaP) 
* [api-types](https://www.npmjs.com/package/@biscuitland/api-types) | [cache](https://www.npmjs.com/package/@biscuitland/cache) | [rest](https://www.npmjs.com/package/@biscuitland/rest) | [ws](https://www.npmjs.com/package/@biscuitland/ws) | [helpers](https://www.npmjs.com/package/@biscuitland/helpers)
