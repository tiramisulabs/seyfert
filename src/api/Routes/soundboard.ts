import type {
	RESTGetAPIDefaultsSoundboardSoundsResult,
	RESTGetAPIGuildSoundboardSoundsResult,
	RESTPatchAPIGuildSoundboardSound,
	RESTPatchAPIGuildSoundboardSoundResult,
	RESTPostAPIGuildSoundboardSound,
	RESTPostAPIGuildSoundboardSoundResult,
	RESTPostAPISendSoundboardSound,
} from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';

export interface SoundboardRoutes {
	channels(id: string): {
		'send-soundboard-sound': {
			post(args: RestArguments<RESTPostAPISendSoundboardSound>): Promise<never>;
		};
	};
	'soundboard-default-sounds': {
		get(args?: RestArgumentsNoBody): Promise<RESTGetAPIDefaultsSoundboardSoundsResult>;
	};
	guilds(id: string): {
		get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildSoundboardSoundsResult>;
		'soundboard-sounds': {
			post(
				args: RestArguments<RESTPostAPIGuildSoundboardSound>,
			): Promise<RESTPostAPIGuildSoundboardSoundResult | undefined>;
			(
				id: string,
			): {
				get(args?: RestArgumentsNoBody): Promise<RESTPostAPIGuildSoundboardSoundResult>;
				patch(args?: RestArguments<RESTPatchAPIGuildSoundboardSound>): Promise<RESTPatchAPIGuildSoundboardSoundResult>;
				delete(args?: RestArgumentsNoBody): Promise<never>;
			};
		};
	};
}
