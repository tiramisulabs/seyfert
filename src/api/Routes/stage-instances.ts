import type {
	RESTDeleteAPIStageInstanceResult,
	RESTGetAPIStageInstanceResult,
	RESTPatchAPIStageInstanceJSONBody,
	RESTPatchAPIStageInstanceResult,
	RESTPostAPIStageInstanceJSONBody,
	RESTPostAPIStageInstanceResult,
} from '../../common';
import type { RestArguments } from '../api';
import type { ProxyRequestMethod } from '../Router';

export interface StageInstanceRoutes {
	'stage-instances': {
		post(
			args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIStageInstanceJSONBody>,
		): Promise<RESTPostAPIStageInstanceResult>;
		(
			id: string,
		): {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIStageInstanceResult>;
			patch(
				args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIStageInstanceJSONBody>,
			): Promise<RESTPatchAPIStageInstanceResult>;
			delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIStageInstanceResult>;
		};
	};
}
