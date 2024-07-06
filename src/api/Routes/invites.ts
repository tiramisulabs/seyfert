import type { RESTDeleteAPIInviteResult, RESTGetAPIInviteQuery, RESTGetAPIInviteResult } from 'discord-api-types/v10';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface InviteRoutes {
	invites(id: string): {
		get(args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIInviteQuery>): Promise<RESTGetAPIInviteResult>;
		delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIInviteResult>;
	};
}
