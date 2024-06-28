"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildBasedResource = void 0;
const common_1 = require("../../../common");
class GuildBasedResource {
    cache;
    client;
    namespace = 'base';
    constructor(cache, client) {
        this.cache = cache;
        if (client) {
            this.client = client;
        }
    }
    /** @internal */
    __setClient(client) {
        this.client = client;
    }
    //@ts-expect-error
    filter(data, id, guild_id) {
        return true;
    }
    parse(data, id, guild_id) {
        if (!data.id)
            data.id = id;
        data.guild_id = guild_id;
        return data;
    }
    get adapter() {
        return this.cache.adapter;
    }
    removeIfNI(intent, id, guildId) {
        if (!this.cache.hasIntent(intent)) {
            return this.remove(id, guildId);
        }
        return;
    }
    setIfNI(intent, id, guildId, data) {
        if (!this.cache.hasIntent(intent)) {
            return this.set(id, guildId, data);
        }
    }
    get(id, guild) {
        return this.adapter.get(this.hashGuildId(guild, id));
    }
    bulk(ids, guild) {
        return (0, common_1.fakePromise)(this.adapter.bulkGet(ids.map(id => this.hashGuildId(guild, id)))).then(x => x.filter(y => y));
    }
    set(__keys, guild, data) {
        const keys = (Array.isArray(__keys) ? __keys : [[__keys, data]]).filter(x => this.filter(x[1], x[0], guild));
        return (0, common_1.fakePromise)(this.addToRelationship(keys.map(x => x[0]), guild)).then(() => this.adapter.bulkSet(keys.map(([key, value]) => {
            return [this.hashGuildId(guild, key), this.parse(value, key, guild)];
        })));
    }
    patch(__keys, guild, data) {
        const keys = (Array.isArray(__keys) ? __keys : [[__keys, data]]).filter(x => this.filter(x[1], x[0], guild));
        return (0, common_1.fakePromise)(this.adapter.bulkGet(keys.map(([key]) => this.hashGuildId(guild, key)))).then(oldDatas => (0, common_1.fakePromise)(this.addToRelationship(keys.map(x => x[0]), guild)).then(() => this.adapter.bulkSet(keys.map(([key, value]) => {
            const oldData = oldDatas.find(x => x.id === key) ?? {};
            return [this.hashGuildId(guild, key), this.parse({ ...oldData, ...value }, key, guild)];
        }))));
    }
    remove(id, guild) {
        const ids = Array.isArray(id) ? id : [id];
        return (0, common_1.fakePromise)(this.removeToRelationship(ids, guild)).then(() => this.adapter.bulkRemove(ids.map(x => this.hashGuildId(guild, x))));
    }
    keys(guild) {
        return this.adapter.scan(this.hashGuildId(guild, '*'), true);
    }
    values(guild) {
        return this.adapter.scan(this.hashGuildId(guild, '*'));
    }
    count(guild) {
        return (0, common_1.fakePromise)(this.adapter.scan(this.hashGuildId(guild, '*'), true)).then(data => data.length);
    }
    contains(id, guild) {
        return this.adapter.contains(this.hashId(guild), id);
    }
    getToRelationship(guild) {
        return this.adapter.getToRelationship(this.hashId(guild));
    }
    addToRelationship(id, guild) {
        return this.adapter.addToRelationship(this.hashId(guild), id);
    }
    removeToRelationship(id, guild) {
        return this.adapter.removeToRelationship(this.hashId(guild), id);
    }
    removeRelationship(id) {
        return this.adapter.removeRelationship((Array.isArray(id) ? id : [id]).map(x => this.hashId(x)));
    }
    hashId(id) {
        return id.startsWith(this.namespace) ? id : `${this.namespace}.${id}`;
    }
    hashGuildId(guild, id) {
        return id.startsWith(this.namespace) ? id : `${this.namespace}.${guild}.${id}`;
    }
}
exports.GuildBasedResource = GuildBasedResource;
