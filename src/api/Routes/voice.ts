import type { RESTGetAPIVoiceRegionsResult } from '../../types';
import type { RestArgumentsNoBody } from '../api';

export interface VoiceRoutes {
	voice: {
		regions: {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPIVoiceRegionsResult>;
		};
	};
}
