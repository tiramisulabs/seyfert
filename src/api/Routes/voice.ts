import type { RESTGetAPIVoiceRegionsResult } from '../../common';
import type { RestArguments } from '../api';
import type { ProxyRequestMethod } from '../Router';

export interface VoiceRoutes {
	voice: {
		region: {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIVoiceRegionsResult>;
		};
	};
}
