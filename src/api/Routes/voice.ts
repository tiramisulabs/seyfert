import type { RESTGetAPIVoiceRegionsResult } from '../../types';
import type { RestArgumentsNoBody } from '../api';

export interface VoiceRoutes {
	voice: {
		/** @deprecated Discord uses `regions`; this legacy path is retained for v4 compatibility. */
		region: {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPIVoiceRegionsResult>;
		};
		regions: {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPIVoiceRegionsResult>;
		};
	};
}
