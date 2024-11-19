import type { RESTGetAPIDefaultsSoundboardSoundsResult } from '../../types';
import type { RestArgumentsNoBody } from '../api';

export interface SoundboardRoutes {
	'soundboard-default-sounds': {
		get(args?: RestArgumentsNoBody): Promise<RESTGetAPIDefaultsSoundboardSoundsResult>;
	};
}
