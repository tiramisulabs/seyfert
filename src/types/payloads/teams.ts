/**
 * Types extracted from https://discord.com/developers/docs/topics/teams
 */

import type { Snowflake } from '../index';
import type { APIUser } from './user';

/**
 * https://discord.com/developers/docs/topics/teams#data-models-team-object
 */
export interface APITeam {
	/**
	 * A hash of the image of the team's icon
	 */
	icon: string | null;
	/**
	 * The unique id of the team
	 */
	id: Snowflake;
	/**
	 * The members of the team
	 */
	members: APITeamMember[];
	/**
	 * The name of the team
	 */
	name: string;
	/**
	 * The user id of the current team owner
	 */
	owner_user_id: Snowflake;
}

/**
 * https://discord.com/developers/docs/topics/teams#data-models-team-member-object
 */
export interface APITeamMember {
	/**
	 * The user's membership state on the team
	 *
	 * See https://discord.com/developers/docs/topics/teams#data-models-membership-state-enum
	 */
	membership_state: TeamMemberMembershipState;
	/**
	 * The id of the parent team of which they are a member
	 */
	team_id: Snowflake;
	/**
	 * The avatar, discriminator, id, and username of the user
	 *
	 * See https://discord.com/developers/docs/resources/user#user-object
	 */
	user: APIUser;
	/**
	 * The user's role in the team.
	 *
	 * See https://discord.com/developers/docs/topics/teams#team-member-roles
	 */
	role: TeamMemberRole;
}

/**
 * https://discord.com/developers/docs/topics/teams#data-models-membership-state-enum
 */
export enum TeamMemberMembershipState {
	Invited = 1,
	Accepted,
}

/**
 * https://discord.com/developers/docs/topics/teams#team-member-roles-team-member-role-types
 */
export enum TeamMemberRole {
	Admin = 'admin',
	Developer = 'developer',
	ReadOnly = 'read_only',
}
