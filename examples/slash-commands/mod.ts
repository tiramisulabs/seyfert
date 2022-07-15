import "https://deno.land/std@0.146.0/dotenv/load.ts";
import {
    CreateApplicationCommand,
    GatewayIntents,
    InteractionResponseTypes,
    Session,
} from "https://deno.land/x/biscuit/mod.ts";

const token = Deno.env.get("TOKEN") ?? Deno.args[0];

if (!token) {
    throw new Error("Please provide a token");
}

const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages;
const session = new Session({ token, intents });

const command: CreateApplicationCommand = {
    name: "ping",
    description: "Replies with pong!",
};

session.on("ready", async (payload) => {
    console.log("Logged in as:", payload.user.username);
    console.log("Creating the application commands...");
    // create command
    try {
        await session.createApplicationCommand(command);
        console.log("Done!");
    } catch (err) {
        console.error(err);
    }
});

// Follow interaction event
session.on("interactionCreate", (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }

    if (interaction.commandName === "ping") {
        interaction.respond({
            type: InteractionResponseTypes.ChannelMessageWithSource,
            data: { content: "pong!" },
        });
    }
});

await session.start();
