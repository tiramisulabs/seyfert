import type { GatewayActivity, GatewayPresenceUpdateDispatchData } from '../../../types';

export class PresenceUpdateHandler {
	presenceUpdate = new Map<string, { timeout: NodeJS.Timeout; presence: GatewayPresenceUpdateDispatchData }>();

	check(presence: GatewayPresenceUpdateDispatchData) {
		const key = `${presence.guild_id}.${presence.user.id}`;
		if (!this.presenceUpdate.has(key)) {
			this.setPresence(presence);
			return true;
		}

		const data = this.presenceUpdate.get(key)!;

		if (this.presenceEquals(data.presence, presence)) {
			return false;
		}

		clearTimeout(data.timeout);

		this.setPresence(presence);

		return true;
	}

	setPresence(presence: GatewayPresenceUpdateDispatchData) {
		const key = `${presence.guild_id}.${presence.user.id}`;
		this.presenceUpdate.set(key, {
			presence,
			timeout: setTimeout(() => {
				this.presenceUpdate.delete(key);
			}, 1.5e3),
		});
	}

	presenceEquals(oldPresence: GatewayPresenceUpdateDispatchData, newPresence: GatewayPresenceUpdateDispatchData) {
		return (
			oldPresence.status === newPresence.status &&
			oldPresence.activities?.length === newPresence.activities?.length &&
			oldPresence.activities?.every((activity, index) =>
				this.activityEquals(activity, newPresence.activities?.[index]!),
			) &&
			oldPresence.client_status?.web === newPresence.client_status?.web &&
			oldPresence.client_status?.mobile === newPresence.client_status?.mobile &&
			oldPresence.client_status?.desktop === newPresence.client_status?.desktop
		);
	}

	activityEquals(oldActivity: GatewayActivity, newActivity: GatewayActivity) {
		return (
			oldActivity.name === newActivity.name &&
			oldActivity.type === newActivity.type &&
			oldActivity.url === newActivity.url &&
			oldActivity.state === newActivity.state &&
			oldActivity.details === newActivity.details &&
			oldActivity.emoji?.id === newActivity.emoji?.id &&
			oldActivity.emoji?.name === newActivity.emoji?.name
		);
	}
}
