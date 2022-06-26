import type { Session } from "../session/Session.ts";
import type { DiscordWelcomeScreen } from "../vendor/external.ts";
import WelcomeChannel from "./WelcomeChannel.ts";

/**
 * @link https://discord.com/developers/docs/resources/guild#welcome-screen-object
 */
export class WelcomeScreen {
    constructor(session: Session, data: DiscordWelcomeScreen) {
        this.session = session;
        this.welcomeChannels = data.welcome_channels.map((welcomeChannel) =>
            new WelcomeChannel(session, welcomeChannel)
        );

        if (data.description) {
            this.description = data.description;
        }
    }

    readonly session: Session;

    description?: string;
    welcomeChannels: WelcomeChannel[];
}

export default WelcomeScreen;
