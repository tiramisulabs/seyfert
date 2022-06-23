import { GatewayIntents, Session } from "./deps.ts";

if (!Deno.args[0]) {
    throw new Error("Please provide a token");
}

const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages;
const session = new Session({ token: Deno.args[0], intents });

session.on("ready", (_shardId, payload) => {
    console.log("Logged in as:", payload.user.username);
});

session.on("messageCreate", (message) => {
    if (message.content === "!ping") {
        message.respond({ content: "pong!" });
    }
});

await session.start();
