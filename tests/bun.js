import { GatewayIntents, Session } from "./deps.ts";

const token   = process.env.TOKEN;
const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages;
const session = new Session({ token, intents });

// uncomment to debug stuff
// session.on("debug", (any) => {
//     console.debug(any);
// })

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
