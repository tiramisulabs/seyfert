import type { APIUser, GatewayActivity, GatewayPresenceUpdateDispatchData } from 'discord-api-types/v10';

type FixedGatewayPresenceUpdateDispatchData =
	| (Omit<GatewayPresenceUpdateDispatchData, 'user'> & { user_id: string; user: undefined })
	| (Omit<GatewayPresenceUpdateDispatchData, 'user'> & {
			user: Partial<APIUser> & Pick<APIUser, 'id'>;
			user_id: undefined;
	  });

export class PresenceUpdateHandler {
	presenceUpdate = new Map<string, { timeout: NodeJS.Timeout; presence: FixedGatewayPresenceUpdateDispatchData }>();

	check(presence: FixedGatewayPresenceUpdateDispatchData) {
		if (!this.presenceUpdate.has(presence.user?.id ?? presence.user_id!)) {
			this.setPresence(presence);
			return true;
		}

		const data = this.presenceUpdate.get(presence.user?.id ?? presence.user_id!)!;

		if (this.presenceEquals(data.presence, presence)) {
			return false;
		}

		clearTimeout(data.timeout);

		this.setPresence(presence);

		return true;
	}

	setPresence(presence: FixedGatewayPresenceUpdateDispatchData) {
		this.presenceUpdate.set(presence.user?.id ?? presence.user_id!, {
			presence,
			timeout: setTimeout(() => {
				this.presenceUpdate.delete(presence.user?.id ?? presence.user_id!);
			}, 1.5e3),
		});
	}

	presenceEquals(
		oldPresence: FixedGatewayPresenceUpdateDispatchData,
		newPresence: FixedGatewayPresenceUpdateDispatchData,
	) {
		return (
			newPresence &&
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
