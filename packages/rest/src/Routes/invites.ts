import { RESTDeleteAPIInviteResult, RESTGetAPIInviteQuery, RESTGetAPIInviteResult } from '@biscuitland/common';
import { RestArguments } from '../REST';
import { RequestMethod } from '../Router';

export interface InviteRoutes {
  invites(id: string): {
    get(args?: RestArguments<RequestMethod.Get, RESTGetAPIInviteQuery>): Promise<RESTGetAPIInviteResult>;
    delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIInviteResult>;
  };
}
