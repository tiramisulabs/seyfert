/**
 * Deno example
 */

import "https://deno.land/std@0.146.0/dotenv/load.ts";

// Session to create a new bot (and intents)
import { GatewayIntents, Session } from "https://deno.land/x/biscuit/mod.ts";

const token = Deno.env.get("TOKEN") ?? Deno.args[0];

if (!token) {
    throw new Error("Please provide a token");
}

const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages;
const session = new Session({ token, intents });

session.on("ready", (payload) => {
    console.log("Logged in as:", payload.user.username);
});

const PREFIX = ">";

session.on("messageCreate", (message) => {
    if (message.author?.bot || !message.content.startsWith(PREFIX)) {
        return;
    }

    const args = message.content.substring(PREFIX.length).trim().split(/\s+/gm);
    const name = args.shift()?.toLowerCase();

    if (name === "ping") {
        message.reply({ content: "pong!" });
    }
});

session.start();
