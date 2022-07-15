import "https://deno.land/std@0.146.0/dotenv/load.ts";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyles,
    GatewayIntents,
    InteractionResponseTypes,
    Session,
} from "https://deno.land/x/biscuit/mod.ts?code";

const token = Deno.env.get("TOKEN") ?? Deno.args[0];

if (!token) {
    throw new Error("Please provide a token");
}

const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages;
const session = new Session({ token, intents });

const PREFIX = ">";
const components = new ButtonBuilder().setCustomId("ping").setLabel("Hello!").setStyle(ButtonStyles.Success);
const row = new ActionRowBuilder<ButtonBuilder>().addComponents(components).toJSON();

session.on("ready", (payload) => {
    console.log("Logged in as:", payload.user.username);
});

session.on("messageCreate", (message) => {
    if (message.author?.bot || !message.content.startsWith(PREFIX)) {
        return;
    }

    const args = message.content.substring(PREFIX.length).trim().split(/\s+/gm);
    const name = args.shift()?.toLowerCase();
    console.log(args, name);

    if (name === "ping") {
        message.reply({ components: [row] });
    }
});

// Follow interaction event
session.on("interactionCreate", (interaction) => {
    if (!interaction.isComponent()) {
        return;
    }

    if (interaction.customId === "ping") {
        interaction.respond({
            type: InteractionResponseTypes.ChannelMessageWithSource,
            data: { content: "pong!" },
        });
    }
});

session.start();
