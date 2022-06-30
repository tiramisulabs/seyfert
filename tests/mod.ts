import { GatewayIntents, Session } from "./deps.ts";

if (!Deno.args[0]) {
    throw new Error("Please provide a token");
}

const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages;
const session = new Session({ token: Deno.args[0], intents });

session.on("ready", (payload) => {
    console.log("Logged in as:", payload.user.username);
});

const PREFIX = "&";

session.on("messageCreate", (message) => {
    const args = message.content.slice(PREFIX.length).trim().split(/\s+/gm);
    const name = args.shift()?.toLowerCase();

    if (name === "ping") {
        message.reply({ content: "pong!" });
    }
});

await session.start();
