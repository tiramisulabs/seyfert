import type { Snowflake } from '..';
import type { APIInvite } from '../payloads';

/**
 * https://discord.com/developers/docs/resources/invite#get-invite
 */
export interface RESTGetAPIInviteQuery {
	/**
	 * Whether the invite should contain approximate member counts
	 */
	with_counts?: boolean;
	/**
	 * Whether the invite should contain the expiration date
	 */
	with_expiration?: boolean;
	/**
	 * The guild scheduled event to include with the invite
	 */
	guild_scheduled_event_id?: Snowflake;
}

export type RESTGetAPIInviteResult = APIInvite;

/**
 * https://discord.com/developers/docs/resources/invite#delete-invite
 */
export type RESTDeleteAPIInviteResult = APIInvite;

/**
 * https://discord.com/developers/docs/resources/invite#get-target-users
 */
export type RESTGetTargetUsersResult = string;

/**
 * https://discord.com/developers/docs/resources/invite#get-target-users
 *
 * Updates the users allowed to see and accept this invite.
 * Uploading a file with invalid user IDs will result in a 400 with the invalid IDs described.
 */
export interface RESTPutUpdateTargetUsers {
	/**
	 * A csv file with a single column of user IDs for all the users able to accept this invite
	 */
	target_users_file: Blob;
}

export type RESTPutUpdateTargetUsersResult = undefined;

export enum TargetUsersJobStatusCode {
	/** The default value. */
	UNSPECIFIED = 0,
	/**	The job is still being processed. */
	PROCESSING,
	/** The job has been completed successfully. */
	COMPLETED,
	/** The job has failed, see `error_message` field for more details. */
	FAILED,
}

/**
 * https://discord.com/developers/docs/resources/invite#get-target-users-job-status
 * Processing target users from a CSV when creating or updating an invite is done asynchronously.
 * This endpoint allows you to check the status of that job.
 */
export interface RESTGetTargetUsersJobStatus {
	status: TargetUsersJobStatusCode;
	total_users: number;
	processed_users: number;
	created_at: string;
	completed_at: string | null;
	/** The error message if the job has failed. */
	error_message?: string;
}

export type RESTGetTargetUsersJobStatusResult = RESTGetTargetUsersJobStatus;
