/**
 * Bun example
 * this example should work on most systems, but if it doesn't just clone the library and import everything from mod.ts
 */

const { GatewayIntents, Session } = require("../mod.ts");

// if it didn't worked use:
// import { GatewayIntents, Session } from "@oasisjs/biscuit";

const token = process.env.TOKEN;
const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages;
const session = new Session({ token, intents });

session.on("ready", (payload) => {
    console.log("Logged in as:", payload.user.username);
});

session.on("messageCreate", async (message) => {
    // GET
    if (message.content.startsWith("whatever")) {
        const whatever = await message.fetch();
        console.log(whatever);
    }

    // POST
    if (message.content.startsWith("ping")) {
        message.reply({ content: "pong!" }).catch((err) => console.error(err));
    }
});

await session.start();
