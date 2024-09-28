import type {
	RESTDeleteAPIStageInstanceResult,
	RESTGetAPIStageInstanceResult,
	RESTPatchAPIStageInstanceJSONBody,
	RESTPatchAPIStageInstanceResult,
	RESTPostAPIStageInstanceJSONBody,
	RESTPostAPIStageInstanceResult,
} from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';

export interface StageInstanceRoutes {
	'stage-instances': {
		post(args: RestArguments<RESTPostAPIStageInstanceJSONBody>): Promise<RESTPostAPIStageInstanceResult>;
		(
			id: string,
		): {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPIStageInstanceResult>;
			patch(args: RestArguments<RESTPatchAPIStageInstanceJSONBody>): Promise<RESTPatchAPIStageInstanceResult>;
			delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIStageInstanceResult>;
		};
	};
}
