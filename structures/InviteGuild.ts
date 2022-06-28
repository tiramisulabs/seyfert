import type { Model } from "./Base.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordGuild } from "../vendor/external.ts";
import AnonymousGuild from "./AnonymousGuild.ts";
import WelcomeScreen from "./WelcomeScreen.ts";

export class InviteGuild extends AnonymousGuild implements Model {
    constructor(session: Session, data: Partial<DiscordGuild>) {
        super(session, data);

        if (data.welcome_screen) {
            this.welcomeScreen = new WelcomeScreen(session, data.welcome_screen);
        }
    }

    welcomeScreen?: WelcomeScreen;
}

export default InviteGuild;
