import type { RESTDeleteAPIInviteResult, RESTGetAPIInviteQuery, RESTGetAPIInviteResult } from '../../common';
import type { RestArguments } from '../api';
import type { ProxyRequestMethod } from '../Router';

export interface InviteRoutes {
	invites(id: string): {
		get(args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIInviteQuery>): Promise<RESTGetAPIInviteResult>;
		delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIInviteResult>;
	};
}
