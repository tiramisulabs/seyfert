import type { APIUser, GatewayGuildMemberUpdateDispatchData } from 'discord-api-types/v10';
export declare class MemberUpdateHandler {
    guildMemberUpdate: Map<string, {
        timeout: NodeJS.Timeout;
        member: GatewayGuildMemberUpdateDispatchData;
    }>;
    check(member: GatewayGuildMemberUpdateDispatchData): boolean;
    setMember(member: GatewayGuildMemberUpdateDispatchData): void;
    membersEquals(old: GatewayGuildMemberUpdateDispatchData, member: GatewayGuildMemberUpdateDispatchData): boolean;
    usersEqual(old: APIUser, user: APIUser): boolean;
}
