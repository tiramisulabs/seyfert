import { describe, expect, test } from 'vitest';
import { AuditLogEvent, MessageActivityType } from '../src/types';

describe('Discord API enums', () => {
	test('uses the documented message activity value', () => {
		expect(MessageActivityType.StreamRequest).toBe(6);
	});

	test('keeps the old voice channel status name as an alias of the canonical event', () => {
		expect(AuditLogEvent.VoiceChannelStatusCreate).toBe(192);
		expect(AuditLogEvent.VoiceChannelStatusUpdate).toBe(AuditLogEvent.VoiceChannelStatusCreate);
		expect(AuditLogEvent[192]).toBe('VoiceChannelStatusUpdate');
	});
});
