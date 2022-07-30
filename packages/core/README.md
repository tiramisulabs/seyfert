# @biscuitland/core
[<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/oasisjs/biscuit)
[<img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">](https://discord.gg/KfNW3CpRfJ)

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
import { Session } from '@biscuitland/core';
import { GatewayIntents } from '@biscuitland/api-types';

const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages;
const session = new Session({ token: 'your token', intents });

session.events.on('ready', ({ user }) => {
    console.log('Logged in as:', user.username);
});

session.events.on('messageCreate', (message) => {
    if (message.content.startsWith('!ping')) {
        message.reply({ content: 'pong!' });
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
B:\project> node --experimenta-fetch index.js
```
