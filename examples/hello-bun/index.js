/**
 * Bun example
 * this example should work on most systems, but if it doesn't just clone the library and import everything from mod.ts
*/

import { GatewayIntents, Session } from "@oasisjs/biscuit";
// if it didn't worked use:
// const { GatewayIntents, Session } = require("@oasisjs/biscuit");
 
const token = process.env.TOKEN;
const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages;
const session = new Session({ token, intents });
 
session.on("ready", (payload) => {
    console.log("Logged in as:", payload.user.username);
});
 
session.on("messageCreate", async (message) => {
    if (message.content.startsWith("whatever")) {
        const whatever = await message.fetch().then(console.log);
        console.log(whatever);
    }
 
    if (message.content.startsWith("ping")) {
        message.reply({ content: "pong!" }).catch((err) => console.error(err));
    }
});
 
await session.start();
 