import type { RESTDeleteAPIInviteResult, RESTGetAPIInviteQuery, RESTGetAPIInviteResult } from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';

export interface InviteRoutes {
	invites(id: string): {
		get(args?: RestArguments<RESTGetAPIInviteQuery>): Promise<RESTGetAPIInviteResult>;
		delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIInviteResult>;
	};
}
