import { describe, expect, test, vi } from 'vitest';
import { SeyfertError } from '../src/common';
import { VoiceState } from '../src/structures/VoiceState';

function createVoiceState() {
	const requestSpeak = vi.fn().mockResolvedValue(undefined);
	const voiceState = new VoiceState(
		{ voiceStates: { requestSpeak } } as never,
		{
			guild_id: '100000000000000001',
			user_id: '100000000000000002',
			channel_id: '100000000000000003',
			session_id: 'session',
		} as never,
	);
	return { requestSpeak, voiceState };
}

describe('VoiceState.requestSpeak', () => {
	test.each([
		['an unparsable string', 'not a date'],
		['an invalid Date', new Date(Number.NaN)],
	])('rejects with a SeyfertError for %s without calling REST', async (_label, date) => {
		const { requestSpeak, voiceState } = createVoiceState();

		const error = await voiceState.requestSpeak(date).catch((reason: unknown) => reason);

		expect(error).toBeInstanceOf(SeyfertError);
		expect(error).toMatchObject({ code: 'INVALID_DATE' });
		expect(requestSpeak).not.toHaveBeenCalled();
	});

	test('sends the ISO timestamp and stores it on success', async () => {
		const { requestSpeak, voiceState } = createVoiceState();

		await voiceState.requestSpeak('2026-01-02T03:04:05.000Z');

		expect(requestSpeak).toHaveBeenCalledWith('100000000000000001', '2026-01-02T03:04:05.000Z');
		expect(voiceState.requestToSpeakTimestamp).toBe('2026-01-02T03:04:05.000Z');
	});
});
