import type { RESTGetAPIVoiceRegionsResult } from '../../types';
import type { RestArgumentsNoBody } from '../api';

export interface VoiceRoutes {
	voice: {
		region: {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPIVoiceRegionsResult>;
		};
	};
}
