import { type APIPollMedia, PollLayoutType, type RESTAPIPollCreate } from 'discord-api-types/v10';
import type { DeepPartial, EmojiResolvable, RestOrArray } from '../common';
import { throwError } from '..';
import { resolvePartialEmoji } from '../structures/extra/functions';

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
		return { ...this.data } as RESTAPIPollCreate;
	}

	private resolvedPollMedia(data: PollMedia) {
		if (!data.emoji) return { text: data.text };
		const resolve = resolvePartialEmoji(data.emoji);
		if (!resolve) return throwError('Invalid Emoji');
		return { text: data.text, emoji: resolve };
	}
}

export type PollMedia = Omit<APIPollMedia, 'emoji'> & { emoji?: EmojiResolvable };
