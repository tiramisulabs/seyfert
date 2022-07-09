import { Model } from "./Base.ts";
import type { Snowflake } from "../Snowflake.ts";
import type { Session } from "../Session.ts";
import { 
    DiscordApplication, 
    TeamMembershipStates, 
    DiscordInstallParams,
    DiscordUser,
    DiscordTeam
} from "../../discordeno/mod.ts";
import User from "./User.ts";

type SummaryDeprecated = ""

export interface Team {
    /** a hash of the image of the team's icon */
    icon?: string;
    /** the unique id of the team */
    id: string;
    /** the members of the team */
    members: TeamMember[];
    /** user id of the current team owner */
    ownerUserId: string;
    /** team name */
    name: string;
}

export interface TeamMember {
    /** the user's membership state on the team */
    membershipState: TeamMembershipStates;
    permissions: "*"[];

    teamId: string;

    user: Partial<User> & Pick<User, "avatarHash" | "discriminator" | "id" | "username">
}

// NewTeam create a new Team object for discord applications
export function NewTeam(session: Session, data: DiscordTeam): Team {
    return {
        icon: data.icon ? data.icon : undefined,
        id: data.id,
        members: data.members.map(member => {
            return {
                membershipState: member.membership_state,
                permissions: member.permissions,
                teamId: member.team_id,
                user: new User(session, member.user)
            }
        }),
        ownerUserId: data.owner_user_id,
        name: data.name,
    }
}
/**
 * @link https://discord.com/developers/docs/resources/application#application-object
 */
export class Application implements Model {

    constructor(session: Session, data: DiscordApplication) {
        this.id = data.id;
        this.session = session;

        this.name = data.name;
        this.icon = data.icon || undefined;
        this.description = data.description;
        this.rpcOrigins = data.rpc_origins;
        this.botPublic = data.bot_public;
        this.botRequireCodeGrant = data.bot_require_code_grant;
        this.termsOfServiceURL = data.terms_of_service_url;
        this.privacyPolicyURL = data.privacy_policy_url;
        this.owner = data.owner ? new User(session, data.owner as DiscordUser) : undefined;
        this.summary = "";
        this.verifyKey = data.verify_key;
        this.team = data.team ? NewTeam(session, data.team) : undefined;
        this.guildId = data.guild_id;
        this.coverImage = data.cover_image;
        this.tags = data.tags;
        this.installParams = data.install_params;
        this.customInstallURL = data.custom_install_url;
    }

    readonly session: Session;
    id: Snowflake;
    name: string;
    icon?: string;
    description: string;
    rpcOrigins?: string[];
    botPublic: boolean;
    botRequireCodeGrant: boolean;
    termsOfServiceURL?: string;
    privacyPolicyURL?: string;
    owner?: Partial<User>;
    summary: SummaryDeprecated;
    verifyKey: string;
    team?: Team;
    guildId?: Snowflake;
    primarySkuId?: Snowflake;
    slug?: string;
    coverImage?: string;
    flags?: number;
    tags?: string[];
    installParams?: DiscordInstallParams;
    customInstallURL?: string;
}

export default Application;