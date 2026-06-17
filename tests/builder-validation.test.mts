import { describe, expect, test } from 'vitest';
import { MediaGalleryItem, Modal, PollBuilder, StringSelectMenu, StringSelectOption } from '../lib';
import { SeyfertError } from '../lib/common';

function expectSeyfertCode(run: () => unknown, code: string, component: string) {
	let thrown: unknown;

	try {
		run();
	} catch (error) {
		thrown = error;
	}

	expect(thrown).toBeInstanceOf(SeyfertError);
	expect(thrown).toMatchObject({
		code,
		metadata: expect.objectContaining({ component }),
	});
}

describe('builder toJSON validation', () => {
	test('PollBuilder rejects missing question media', () => {
		const poll = new PollBuilder().setAnswers({ text: 'Yes' });

		expectSeyfertCode(() => poll.toJSON(), 'MISSING_POLL_QUESTION', 'PollBuilder');
	});

	test('PollBuilder rejects empty question media', () => {
		const poll = new PollBuilder({ question: {} }).setAnswers({ text: 'Yes' });

		expectSeyfertCode(() => poll.toJSON(), 'MISSING_POLL_QUESTION', 'PollBuilder');
	});

	test('PollBuilder rejects missing or empty answers', () => {
		const missingAnswers = new PollBuilder().setQuestion({ text: 'Continue?' });
		const emptyAnswers = new PollBuilder().setQuestion({ text: 'Continue?' }).setAnswers([]);

		expectSeyfertCode(() => missingAnswers.toJSON(), 'MISSING_POLL_ANSWERS', 'PollBuilder');
		expectSeyfertCode(() => emptyAnswers.toJSON(), 'MISSING_POLL_ANSWERS', 'PollBuilder');
	});

	test('Modal rejects missing custom id and title', () => {
		const withoutCustomId = new Modal().setTitle('Settings');
		const withoutTitle = new Modal().setCustomId('settings');

		expectSeyfertCode(() => withoutCustomId.toJSON(), 'MISSING_MODAL_CUSTOM_ID', 'Modal');
		expectSeyfertCode(() => withoutTitle.toJSON(), 'MISSING_MODAL_TITLE', 'Modal');
	});

	test('MediaGalleryItem rejects missing media', () => {
		const item = new MediaGalleryItem().setDescription('Screenshot');

		expectSeyfertCode(() => item.toJSON(), 'MISSING_MEDIA', 'MediaGalleryItem');
	});

	test('StringSelectOption rejects missing label', () => {
		const option = new StringSelectOption().setValue('general');

		expectSeyfertCode(() => option.toJSON(), 'MISSING_STRING_SELECT_OPTION_LABEL', 'StringSelectOption');
	});

	test('StringSelectOption rejects missing value', () => {
		const option = new StringSelectOption().setLabel('General');

		expectSeyfertCode(() => option.toJSON(), 'MISSING_STRING_SELECT_OPTION_VALUE', 'StringSelectOption');
	});

	test('StringSelectMenu addOption accepts raw API options', () => {
		const menu = new StringSelectMenu().setCustomId('topics').addOption({ label: 'General', value: 'general' });

		expect(menu.toJSON().options).toEqual([{ label: 'General', value: 'general' }]);
	});

	test('StringSelectMenu setOptions accepts raw API option arrays', () => {
		const menu = new StringSelectMenu()
			.setCustomId('topics')
			.setOptions([{ label: 'General', value: 'general' }]);

		expect(menu.toJSON().options).toEqual([{ label: 'General', value: 'general' }]);
	});

	test('StringSelectMenu setOptions accepts spread builder and raw options', () => {
		const menu = new StringSelectMenu()
			.setCustomId('topics')
			.setOptions(new StringSelectOption({ label: 'News', value: 'news' }), {
				label: 'General',
				value: 'general',
			});

		expect(menu.toJSON().options).toEqual([
			{ label: 'News', value: 'news' },
			{ label: 'General', value: 'general' },
		]);
	});
});
