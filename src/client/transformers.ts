import type { CustomStructures } from '../commands';
import { Poll } from '../structures';

export type PollStructure = InferCustomStructure<Poll, 'Poll'>;

export class Transformers {
	static Poll(...args: ConstructorParameters<typeof Poll>): PollStructure {
		return new Poll(...args);
	}
}

export type InferCustomStructure<T, N extends string> = CustomStructures extends Record<N, infer P> ? P : T;
