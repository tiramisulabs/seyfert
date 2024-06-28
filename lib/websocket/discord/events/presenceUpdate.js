"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceUpdateHandler = void 0;
class PresenceUpdateHandler {
    presenceUpdate = new Map();
    check(presence) {
        if (!this.presenceUpdate.has(presence.user.id)) {
            this.setPresence(presence);
            return true;
        }
        const data = this.presenceUpdate.get(presence.user.id);
        if (this.presenceEquals(data.presence, presence)) {
            return false;
        }
        clearTimeout(data.timeout);
        this.setPresence(presence);
        return true;
    }
    setPresence(presence) {
        this.presenceUpdate.set(presence.user.id, {
            presence,
            timeout: setTimeout(() => {
                this.presenceUpdate.delete(presence.user.id);
            }, 1.5e3),
        });
    }
    presenceEquals(oldPresence, newPresence) {
        return (newPresence &&
            oldPresence.status === newPresence.status &&
            oldPresence.activities?.length === newPresence.activities?.length &&
            oldPresence.activities?.every((activity, index) => this.activityEquals(activity, newPresence.activities?.[index])) &&
            oldPresence.client_status?.web === newPresence.client_status?.web &&
            oldPresence.client_status?.mobile === newPresence.client_status?.mobile &&
            oldPresence.client_status?.desktop === newPresence.client_status?.desktop);
    }
    activityEquals(oldActivity, newActivity) {
        return (oldActivity.name === newActivity.name &&
            oldActivity.type === newActivity.type &&
            oldActivity.url === newActivity.url &&
            oldActivity.state === newActivity.state &&
            oldActivity.details === newActivity.details &&
            oldActivity.emoji?.id === newActivity.emoji?.id &&
            oldActivity.emoji?.name === newActivity.emoji?.name);
    }
}
exports.PresenceUpdateHandler = PresenceUpdateHandler;
