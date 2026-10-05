import { describe, expect, test } from 'vitest';
import { PollBuilder, RadioGroup, RadioGroupOption, StringSelectMenu, StringSelectOption } from '../lib';
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
	test('PollBuilder rejects missing or empty answers', () => {
		const missingAnswers = new PollBuilder().setQuestion({ text: 'Continue?' });
		const emptyAnswers = new PollBuilder().setQuestion({ text: 'Continue?' }).setAnswers([]);

		expectSeyfertCode(() => missingAnswers.toJSON(), 'MISSING_POLL_ANSWERS', 'PollBuilder');
		expectSeyfertCode(() => emptyAnswers.toJSON(), 'MISSING_POLL_ANSWERS', 'PollBuilder');
	});

	test('RadioGroup validates builder options through option toJSON', () => {
		const option = new RadioGroupOption({ value: 'general', label: 'General' });
		delete (option.data as { value?: string }).value;
		const menu = new RadioGroup()
			.setCustomId('topics')
			.setOptions(option, new RadioGroupOption({ label: 'Other', value: 'other' }));

		expectSeyfertCode(() => menu.toJSON(), 'MISSING_RADIO_GROUP_OPTION_VALUE', 'RadioGroupOption');
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
