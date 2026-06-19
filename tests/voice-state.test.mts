import { describe, expect, test } from 'vitest';
import { VoiceState } from '../lib';

const voiceStateData = {
	guild_id: '100000000000000001',
	channel_id: '200000000000000002',
	user_id: '300000000000000003',
	session_id: 'session',
	deaf: false,
	mute: false,
	self_deaf: true,
	self_mute: false,
	self_video: true,
	suppress: true,
	request_to_speak_timestamp: null,
} as any;

describe('VoiceState', () => {
	test('exposes derived boolean state getters', () => {
		const voiceState = new VoiceState({} as any, voiceStateData);

		expect(voiceState.isDeafened).toBe(true);
	});
});
