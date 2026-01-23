import { MakeRequired } from '../../common';
import type {
	RESTDeleteAPIInviteResult,
	RESTGetAPIInviteQuery,
	RESTGetAPIInviteResult,
	RESTGetTargetUsersJobStatusResult,
	RESTGetTargetUsersResult,
	RESTPutUpdateTargetUsers,
	RESTPutUpdateTargetUsersResult,
} from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';

export interface InviteRoutes {
	invites(id: string): {
		get(args?: RestArguments<RESTGetAPIInviteQuery>): Promise<RESTGetAPIInviteResult>;
		delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIInviteResult>;
		['target-users']: {
			get(args?: RestArgumentsNoBody): Promise<RESTGetTargetUsersResult>;
			put(
				args: MakeRequired<RestArguments<RESTPutUpdateTargetUsers>, 'appendToFormData'>,
			): Promise<RESTPutUpdateTargetUsersResult>;
			['job-status']: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetTargetUsersJobStatusResult>;
			};
		};
	};
}
