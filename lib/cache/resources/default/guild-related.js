"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildRelatedResource = void 0;
const common_1 = require("../../../common");
class GuildRelatedResource {
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
    }
    setIfNI(intent, id, guildId, data) {
        if (!this.cache.hasIntent(intent)) {
            return this.set(id, guildId, data);
        }
    }
    get(id) {
        return this.adapter.get(this.hashId(id));
    }
    bulk(ids) {
        return (0, common_1.fakePromise)(this.adapter.bulkGet(ids.map(x => this.hashId(x)))).then(x => x.filter(y => y));
    }
    set(__keys, guild, data) {
        const keys = (Array.isArray(__keys) ? __keys : [[__keys, data]]).filter(x => this.filter(x[1], x[0], guild));
        return (0, common_1.fakePromise)(this.addToRelationship(keys.map(x => x[0]), guild)).then(() => this.adapter.bulkSet(keys.map(([key, value]) => {
            return [this.hashId(key), this.parse(value, key, guild)];
        })));
    }
    patch(__keys, guild, data) {
        const keys = (Array.isArray(__keys) ? __keys : [[__keys, data]]).filter(x => this.filter(x[1], x[0], guild));
        if (guild) {
            return (0, common_1.fakePromise)(this.addToRelationship(keys.map(x => x[0]), guild)).then(() => this.adapter.bulkPatch(false, keys.map(([key, value]) => {
                return [this.hashId(key), this.parse(value, key, guild)];
            })));
        }
        return (0, common_1.fakePromise)(this.adapter.bulkPatch(true, keys.map(([key, value]) => {
            return [this.hashId(key), value];
        }))).then(x => x);
    }
    remove(id, guild) {
        const ids = Array.isArray(id) ? id : [id];
        return (0, common_1.fakePromise)(this.removeToRelationship(ids, guild)).then(() => this.adapter.bulkRemove(ids.map(x => this.hashId(x))));
    }
    keys(guild) {
        return guild === '*'
            ? this.adapter.scan(this.hashId(guild), true)
            : (0, common_1.fakePromise)(this.adapter.getToRelationship(this.hashId(guild))).then(keys => keys.map(x => `${this.namespace}.${x}`));
    }
    values(guild) {
        return guild === '*'
            ? (0, common_1.fakePromise)(this.adapter.scan(this.hashId(guild))).then(x => x)
            : (0, common_1.fakePromise)(this.adapter.getToRelationship(this.hashId(guild))).then(keys => this.adapter.bulkGet(keys.map(x => `${this.namespace}.${x}`)));
    }
    count(to) {
        return to === '*'
            ? (0, common_1.fakePromise)(this.keys(to)).then(x => x.length)
            : this.adapter.count(this.hashId(to));
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
}
exports.GuildRelatedResource = GuildRelatedResource;
