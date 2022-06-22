import * as Discord from "./deps.ts";

if (!Deno.args[0]) {
    throw new Error("Please provide a token");
}

const session = new Discord.Session({
    token: Deno.args[0],
    intents: Discord.GatewayIntents.MessageContent | Discord.GatewayIntents.Guilds |
        Discord.GatewayIntents.GuildMessages,
});

session.on("ready", (payload) => console.log(payload));
session.on("messageCreate", (payload) => console.log(payload));
// session.on("raw", (data, shardId) => console.log(shardId, data));

console.log("hello");

session.start();
