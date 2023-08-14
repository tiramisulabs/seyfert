# @biscuitland/core
Core contains the essentials to launch you to develop your own customized and scalable bot.

[<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/oasisjs/biscuit)
[<img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">](https://discord.gg/XNw2RZFzaP)

## Getting Started

### Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @biscuitland/core
yarn add @biscuitland/core
```

### Example bot
`project/index.js`:
```ts
import { Session } from '@biscuitland/core';
import { GatewayIntentBits } from '@biscuitland/common';

const session = new Session({ token: 'your token', intents: GatewayIntentBits.Guilds });

session.on('READY', (payload, shardId) => {
    console.log('Logged in as: %s in shard #%s', payload.user.username, shardId);
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
* [rest](https://www.npmjs.com/package/@biscuitland/rest) | [ws](https://www.npmjs.com/package/@biscuitland/ws) | [helpers](https://www.npmjs.com/package/@biscuitland/helpers)
