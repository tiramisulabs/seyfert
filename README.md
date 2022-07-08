# biscuit
## A brand new bleeding edge non bloated Discord library

The biscuit Discord library is built ontop of Discordeno and webspec APIs, we aim to provide portability and scalabilty.

Most importantly, biscuit is:
* A modular [Discordeno](https://github.com/discordeno/discordeno) fork
* A portable cross platform Discord library
* A framework to build Discord bots in Deno
* A bleeding edge API to contact Discord

Biscuit is primarly inspired by Discord.js and Discordeno but it does not include a cache layer by default

# Example bot
```js
import { GatewayIntents, Session } from "biscuit";

const token = "your token goes here";

const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages; 
const session = new Session({ token, intents });

session.on("ready", (payload) => {
    console.log("Logged in as:", payload.user.username)
});

session.on("messageCreate", (message) => {
    if (message.content.startsWith("!ping")) {
        message.reply({ content: "pong!" });
    }
});

session.start();
```
