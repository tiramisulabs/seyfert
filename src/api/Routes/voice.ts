import type { RESTGetAPIVoiceRegionsResult } from 'discord-api-types/v10';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface VoiceRoutes {
	voice: {
		region: {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIVoiceRegionsResult>;
		};
	};
}
