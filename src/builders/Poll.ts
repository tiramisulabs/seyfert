import {
	createValidationMetadata,
	type DeepPartial,
	type EmojiResolvable,
	type RestOrArray,
	resolvePartialEmoji,
	SeyfertError,
} from '../common';
import { type APIPollMedia, PollLayoutType, type RESTAPIPollCreate } from '../types';

export class PollBuilder {
	constructor(public data: DeepPartial<RESTAPIPollCreate> = {}) {
		this.data.layout_type = PollLayoutType.Default;
	}

	addAnswers(...answers: RestOrArray<PollMedia>) {
		this.data.answers = (this.data.answers ?? []).concat(
			answers.flat().map(x => ({ poll_media: this.resolvedPollMedia(x) })),
		);
		return this;
	}

	setAnswers(...answers: RestOrArray<PollMedia>) {
		this.data.answers = answers.flat().map(x => ({ poll_media: this.resolvedPollMedia(x) }));
		return this;
	}

	setQuestion(data: PollMedia) {
		this.data.question ??= {};
		const { emoji, text } = this.resolvedPollMedia(data);
		this.data.question.text = text;
		this.data.question.emoji = emoji;
		return this;
	}

	setDuration(hours: number) {
		this.data.duration = hours;
		return this;
	}

	allowMultiselect(value = true) {
		this.data.allow_multiselect = value;
		return this;
	}

	toJSON(): RESTAPIPollCreate {
		if (!this.data.question?.text && !this.data.question?.emoji)
			throw new SeyfertError('MISSING_POLL_QUESTION', {
				metadata: {
					...createValidationMetadata('question to be set before calling toJSON()', this.data.question, {
						component: 'PollBuilder',
					}),
					detail: 'Cannot convert to JSON without a question.',
				},
			});
		if (!this.data.answers?.length)
			throw new SeyfertError('MISSING_POLL_ANSWERS', {
				metadata: {
					...createValidationMetadata('at least one answer to be set before calling toJSON()', this.data.answers, {
						component: 'PollBuilder',
					}),
					detail: 'Cannot convert to JSON without answers.',
				},
			});
		return { ...this.data } as RESTAPIPollCreate;
	}

	private resolvedPollMedia(data: PollMedia) {
		if (!data.emoji) return { text: data.text };
		const resolve = resolvePartialEmoji(data.emoji);
		if (!resolve)
			throw new SeyfertError('INVALID_EMOJI', {
				metadata: {
					...createValidationMetadata('EmojiResolvable', data.emoji, { component: 'PollBuilder' }),
					detail: 'Invalid Emoji',
				},
			});
		return { text: data.text, emoji: resolve };
	}
}

export type PollMedia = Omit<APIPollMedia, 'emoji'> & { emoji?: EmojiResolvable };
