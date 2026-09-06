import { apiVoiceState } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { VoiceState } from '../lib';

const voiceStateData = apiVoiceState({
	channelId: '200000000000000002',
	userId: '300000000000000003',
	sessionId: 'session',
	selfDeaf: true,
	selfVideo: true,
	suppress: true,
});

describe('VoiceState', () => {
	test('exposes derived boolean state getters', () => {
		const voiceState = new VoiceState({} as any, voiceStateData);

		expect(voiceState.isDeafened).toBe(true);
		expect(voiceState.isCameraOn).toBe(true);
		expect(voiceState.isStreaming).toBe(false);
		expect(voiceState.isSuppressed).toBe(true);
	});
});
