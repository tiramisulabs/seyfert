import type { MakeRequired } from '../../common';
import type {
	RESTDeleteAPIInviteResult,
	RESTDeleteRemoveTargetUserResult,
	RESTGetAPIInviteQuery,
	RESTGetAPIInviteResult,
	RESTGetTargetUsersJobStatusResult,
	RESTGetTargetUsersResult,
	RESTPostBulkAddTargetUsersJSONBody,
	RESTPostBulkAddTargetUsersResult,
	RESTPostBulkDeleteTargetUsersJSONBody,
	RESTPostBulkDeleteTargetUsersResult,
	RESTPutAddTargetUserResult,
	RESTPutUpdateTargetUsers,
	RESTPutUpdateTargetUsersResult,
} from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';

export interface InviteRoutes {
	invites(id: string): {
		get(args?: RestArgumentsNoBody<RESTGetAPIInviteQuery>): Promise<RESTGetAPIInviteResult>;
		delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIInviteResult>;
		'target-users': {
			get(args?: RestArgumentsNoBody): Promise<RESTGetTargetUsersResult>;
			put(
				args: MakeRequired<RestArguments<RESTPutUpdateTargetUsers>, 'appendToFormData'>,
			): Promise<RESTPutUpdateTargetUsersResult>;
			(
				id: string,
			): {
				put(args?: RestArgumentsNoBody): Promise<RESTPutAddTargetUserResult>;
				delete(args?: RestArgumentsNoBody): Promise<RESTDeleteRemoveTargetUserResult>;
			};
			'bulk-add': {
				post(args: RestArguments<RESTPostBulkAddTargetUsersJSONBody>): Promise<RESTPostBulkAddTargetUsersResult>;
			};
			'bulk-delete': {
				post(args: RestArguments<RESTPostBulkDeleteTargetUsersJSONBody>): Promise<RESTPostBulkDeleteTargetUsersResult>;
			};
			'job-status': {
				get(args?: RestArgumentsNoBody): Promise<RESTGetTargetUsersJobStatusResult>;
			};
		};
	};
}
