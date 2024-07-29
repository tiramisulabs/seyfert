import type { RESTGetAPIVoiceRegionsResult } from '../../types';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface VoiceRoutes {
	voice: {
		region: {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIVoiceRegionsResult>;
		};
	};
}
