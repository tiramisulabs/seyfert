"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberUpdateHandler = void 0;
class MemberUpdateHandler {
    guildMemberUpdate = new Map();
    check(member) {
        if (!this.guildMemberUpdate.has(member.user.id)) {
            this.setMember(member);
            return true;
        }
        const data = this.guildMemberUpdate.get(member.user.id);
        if (this.usersEqual(data.member.user, member.user)) {
            return this.membersEquals(data.member, member);
        }
        clearTimeout(data.timeout);
        this.setMember(member);
        return true;
    }
    setMember(member) {
        this.guildMemberUpdate.set(member.user.id, {
            member,
            timeout: setTimeout(() => {
                this.guildMemberUpdate.delete(member.user.id);
            }, 1.5e3),
        });
    }
    membersEquals(old, member) {
        return (old.joined_at === member.joined_at &&
            old.nick === member.nick &&
            old.avatar === member.avatar &&
            old.pending === member.pending &&
            old.communication_disabled_until === member.communication_disabled_until &&
            old.flags === member.flags &&
            (old.roles === member.roles ||
                (old.roles.length === member.roles.length && old.roles.every((role, i) => role === member.roles[i]))));
    }
    usersEqual(old, user) {
        return (old.username === user.username &&
            old.discriminator === user.discriminator &&
            old.global_name === user.global_name &&
            old.avatar === user.avatar &&
            old.public_flags === user.public_flags &&
            old.banner === user.banner &&
            old.accent_color === user.accent_color);
    }
}
exports.MemberUpdateHandler = MemberUpdateHandler;
