# biscuit

## A brand new bleeding edge non bloated Discord library

[![nest.land](https://nest.land/badge.svg)](https://nest.land/package/biscuit)
[![npm](https://img.shields.io/npm/v/@oasisjs/biscuit?color=red&label=package&logo=npm&style=flat)](https://www.npmjs.com/package/@oasisjs/biscuit)
[![downloads](https://img.shields.io/npm/dw/@oasisjs/biscuit?color=green&logo=npm&style=flat)](https://www.npmjs.com/package/@oasisjs/biscuit)
[![deno.land](https://img.shields.io/badge/deno-%5E1.23.3-informational?color=blue&logo=deno&style=flat)](https://deno.land/x/biscuit)

<img align="right" src="https://raw.githubusercontent.com/oasisjs/biscuit/main/assets/biscuit.svg" alt="biscuit"/>

### Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @oasisjs/biscuit
pnpm add @oasisjs/biscuit
yarn add @oasisjs/biscuit
```

get a quick bot: `deno run --allow-net https://crux.land/2CENgN [token]`

The biscuit Discord library is built ontop of Discordeno and webspec APIs, we aim to provide portability. Join our
[Discord](https://discord.gg/zmuvzzEFz2)

### Most importantly, biscuit is:

- A modular [Discordeno](https://github.com/discordeno/discordeno) fork
- A framework to build Discord bots
- A bleeding edge API to contact Discord

Biscuit is primarily inspired by Discord.js and Discordeno but it does not include a cache layer by default, we believe
that you should not make software that does things it is not supposed to do.

### Why biscuit?:

- [Minimal](https://en.wikipedia.org/wiki/Unix_philosophy), non feature-rich!
- Crossplatform
- Consistent
- Performant
- Small bundles

### Example bot (TS/JS)

```js
import Biscuit, { GatewayIntents } from '@oasisjs/biscuit';

const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages;
const session = new Biscuit({ token: 'your token', intents });

session.on('ready', ({ user }) => {
    console.log('Logged in as:', user.username);
});

session.on('messageCreate', (message) => {
    if (message.content.startsWith('!ping')) {
        message.reply({ content: 'pong!' });
    }
});

session.start();
```

### Minimal style guide

- 4 spaces, no tabs
- Semi-colons are mandatory
- Run `deno fmt`
- Avoid circular dependencies

### Contrib guide

- Install Deno extension [here](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)
- Run `deno check` to make sure the library works
- Avoid sharing state between classes

### Compatibility (bun)

**⚠️ DISCLAIMER:** since bun is unstable I highly recommend running biscuit on node!

- We got the library running on EndeavourOS but it spams the ready event multiple times
- We got the library running on Arch/Artix Linux but breaks when sending fetch requests
- We got the library running on WSL (Ubuntu) without any trouble

> if you really want to use the library with bun remember to clone the repo instead of installing it via the registry

### Known issues:

- some properties may be not implemented yet
- some structures are not implemented (see https://github.com/oasisjs/biscuit/issues)
- cache (wip)
- no optimal way to create embeds, should be fixed in builders tho
- no optimal way to deliver a webspec bun version to the registry (#50)
