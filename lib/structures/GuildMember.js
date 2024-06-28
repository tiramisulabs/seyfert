"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionGuildMember = exports.UnavailableMember = exports.GuildMember = exports.BaseGuildMember = void 0;
const DiscordBase_1 = require("./extra/DiscordBase");
const common_1 = require("../common");
const Permissions_1 = require("./extra/Permissions");
const transformers_1 = require("../client/transformers");
class BaseGuildMember extends DiscordBase_1.DiscordBase {
    guildId;
    _roles;
    joinedTimestamp;
    communicationDisabledUntilTimestamp;
    constructor(client, data, id, 
    /** the choosen guild id */
    guildId) {
        const { roles, ...dataN } = data;
        super(client, { ...dataN, id });
        this.guildId = guildId;
        this._roles = data.roles;
        this.patch(data);
    }
    guild(force = false) {
        return this.client.guilds.fetch(this.id, force);
    }
    fetch(force = false) {
        return this.client.members.fetch(this.guildId, this.id, force);
    }
    ban(body, reason) {
        return this.client.members.ban(this.guildId, this.id, body, reason);
    }
    kick(reason) {
        return this.client.members.kick(this.guildId, this.id, reason);
    }
    edit(body, reason) {
        return this.client.members.edit(this.guildId, this.id, body, reason);
    }
    presence() {
        return this.client.members.presence(this.id);
    }
    voice() {
        return this.client.members.voice(this.guildId, this.id);
    }
    toString() {
        return common_1.Formatter.userMention(this.id);
    }
    patch(data) {
        if ('joined_at' in data && data.joined_at) {
            this.joinedTimestamp = Date.parse(data.joined_at);
        }
        if ('communication_disabled_until' in data) {
            this.communicationDisabledUntilTimestamp = data.communication_disabled_until?.length
                ? Date.parse(data.communication_disabled_until)
                : null;
        }
    }
    get roles() {
        return {
            keys: Object.freeze(this._roles.concat(this.guildId)),
            list: (force = false) => this.client.roles
                .list(this.guildId, force)
                .then(roles => roles.filter(role => this.roles.keys.includes(role.id))),
            add: (id) => this.client.members.addRole(this.guildId, this.id, id),
            remove: (id) => this.client.members.removeRole(this.guildId, this.id, id),
            permissions: (force = false) => this.roles.list(force).then(roles => new Permissions_1.PermissionsBitField(roles.map(x => BigInt(x.permissions.bits)))),
            sorted: (force = false) => this.roles.list(force).then(roles => roles.sort((a, b) => b.position - a.position)),
            highest: (force = false) => this.roles.sorted(force).then(roles => roles[0]),
        };
    }
    static methods({ client, guildId }) {
        return {
            resolve: (resolve) => client.members.resolve(guildId, resolve),
            search: (query) => client.members.search(guildId, query),
            unban: (id, body, reason) => client.members.unban(guildId, id, body, reason),
            ban: (id, body, reason) => client.members.ban(guildId, id, body, reason),
            kick: (id, reason) => client.members.kick(guildId, id, reason),
            edit: (id, body, reason) => client.members.edit(guildId, id, body, reason),
            add: (id, body) => client.members.add(guildId, id, body),
            fetch: (memberId, force = false) => client.members.fetch(guildId, memberId, force),
            list: (query, force = false) => client.members.list(guildId, query, force),
        };
    }
}
exports.BaseGuildMember = BaseGuildMember;
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
class GuildMember extends BaseGuildMember {
    guildId;
    user;
    __me;
    constructor(client, data, user, 
    /** the choosen guild id */
    guildId) {
        super(client, data, user.id, guildId);
        this.guildId = guildId;
        this.user = transformers_1.Transformers.User(client, user);
    }
    get tag() {
        return this.user.tag;
    }
    get bot() {
        return this.user.bot;
    }
    get name() {
        return this.user.name;
    }
    get username() {
        return this.user.username;
    }
    get globalName() {
        return this.user.globalName;
    }
    /** gets the nickname or the username */
    get displayName() {
        return this.nick ?? this.globalName ?? this.username;
    }
    dm(force = false) {
        return this.user.dm(force);
    }
    write(body) {
        return this.user.write(body);
    }
    defaultAvatarURL() {
        return this.user.defaultAvatarURL();
    }
    avatarURL(options) {
        if (!this.avatar) {
            return options?.exclude ? null : this.user.avatarURL();
        }
        return this.rest.cdn.guilds(this.guildId).users(this.id).avatars(this.avatar).get(options);
    }
    bannerURL(options) {
        return this.user.bannerURL(options);
    }
    async fetchPermissions(force = false) {
        if ('permissions' in this)
            return this.permissions;
        return this.roles.permissions(force);
    }
    async manageable(force = false) {
        this.__me = await this.client.guilds.fetchSelf(this.guildId, force);
        const ownerId = (await this.client.guilds.fetch(this.guildId, force)).ownerId;
        if (this.user.id === ownerId)
            return false;
        if (this.user.id === this.client.botId)
            return false;
        if (this.client.botId === ownerId)
            return true;
        return (await this.__me.roles.highest()).position > (await this.roles.highest(force)).position;
    }
    async bannable(force = false) {
        return (await this.manageable(force)) && (await this.__me.fetchPermissions(force)).has('BanMembers');
    }
    async kickable(force = false) {
        return (await this.manageable(force)) && (await this.__me.fetchPermissions(force)).has('KickMembers');
    }
    async moderatable(force = false) {
        return (!(await this.roles.permissions(force)).has('Administrator') &&
            (await this.manageable(force)) &&
            (await this.__me.fetchPermissions(force)).has('KickMembers'));
    }
}
exports.GuildMember = GuildMember;
class UnavailableMember extends BaseGuildMember {
}
exports.UnavailableMember = UnavailableMember;
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
class InteractionGuildMember extends GuildMember {
    permissions;
    constructor(client, data, user, 
    /** the choosen guild id */
    guildId) {
        super(client, data, user, guildId);
        this.permissions = new Permissions_1.PermissionsBitField(Number(data.permissions));
    }
}
exports.InteractionGuildMember = InteractionGuildMember;
