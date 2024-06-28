"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisAdapter = void 0;
let Redis;
try {
    Redis = require('ioredis').Redis;
}
catch {
    // potocuit > seyfert
}
class RedisAdapter {
    isAsync = true;
    client;
    namespace;
    constructor(data) {
        if (!Redis) {
            throw new Error('No ioredis installed');
        }
        this.client = 'client' in data ? data.client : new Redis(data.redisOptions);
        this.namespace = data.namespace ?? 'seyfert';
    }
    __scanSets(query, returnKeys = false) {
        const match = this.buildKey(query);
        return new Promise((r, j) => {
            const stream = this.client.scanStream({
                match,
                type: 'set',
            });
            const keys = [];
            stream
                .on('data', resultKeys => keys.push(...resultKeys))
                .on('end', () => (returnKeys ? r(keys.map(x => this.buildKey(x))) : r(this.bulkGet(keys))))
                .on('error', err => j(err));
        });
    }
    scan(query, returnKeys = false) {
        const match = this.buildKey(query);
        return new Promise((r, j) => {
            const stream = this.client.scanStream({
                match,
                // omit relationships
                type: 'hash',
            });
            const keys = [];
            stream
                .on('data', resultKeys => keys.push(...resultKeys))
                .on('end', () => (returnKeys ? r(keys.map(x => this.buildKey(x))) : r(this.bulkGet(keys))))
                .on('error', err => j(err));
        });
    }
    async bulkGet(keys) {
        const pipeline = this.client.pipeline();
        for (const key of keys) {
            pipeline.hgetall(this.buildKey(key));
        }
        return (await pipeline.exec())?.filter(x => !!x[1]).map(x => toNormal(x[1])) ?? [];
    }
    async get(keys) {
        const value = await this.client.hgetall(this.buildKey(keys));
        if (value) {
            return toNormal(value);
        }
    }
    async bulkSet(data) {
        const pipeline = this.client.pipeline();
        for (const [k, v] of data) {
            pipeline.hset(this.buildKey(k), toDb(v));
        }
        await pipeline.exec();
    }
    async set(id, data) {
        await this.client.hset(this.buildKey(id), toDb(data));
    }
    async bulkPatch(updateOnly, data) {
        const pipeline = this.client.pipeline();
        for (const [k, v] of data) {
            if (updateOnly) {
                pipeline.eval(`if redis.call('exists',KEYS[1]) == 1 then redis.call('hset', KEYS[1], ${Array.from({ length: Object.keys(v).length * 2 }, (_, i) => `ARGV[${i + 1}]`)}) end`, 1, this.buildKey(k), ...Object.entries(toDb(v)).flat());
            }
            else {
                pipeline.hset(this.buildKey(k), toDb(v));
            }
        }
        await pipeline.exec();
    }
    async patch(updateOnly, id, data) {
        if (updateOnly) {
            await this.client.eval(`if redis.call('exists',KEYS[1]) == 1 then redis.call('hset', KEYS[1], ${Array.from({ length: Object.keys(data).length * 2 }, (_, i) => `ARGV[${i + 1}]`)}) end`, 1, this.buildKey(id), ...Object.entries(toDb(data)).flat());
        }
        else {
            await this.client.hset(this.buildKey(id), toDb(data));
        }
    }
    async values(to) {
        const array = [];
        const data = await this.keys(to);
        if (data.length) {
            const items = await this.bulkGet(data);
            for (const item of items) {
                if (item) {
                    array.push(item);
                }
            }
        }
        return array;
    }
    async keys(to) {
        const data = await this.getToRelationship(to);
        return data.map(id => this.buildKey(`${to}.${id}`));
    }
    async count(to) {
        return this.client.scard(`${this.buildKey(to)}:set`);
    }
    async bulkRemove(keys) {
        await this.client.del(...keys.map(x => this.buildKey(x)));
    }
    async remove(keys) {
        await this.client.del(this.buildKey(keys));
    }
    async flush() {
        const keys = await Promise.all([
            this.scan(this.buildKey('*'), true),
            this.__scanSets(this.buildKey('*'), true),
        ]).then(x => x.flat());
        if (!keys.length)
            return;
        await this.bulkRemove(keys);
    }
    async contains(to, keys) {
        return (await this.client.sismember(`${this.buildKey(to)}:set`, keys)) === 1;
    }
    async getToRelationship(to) {
        return this.client.smembers(`${this.buildKey(to)}:set`);
    }
    async bulkAddToRelationShip(data) {
        const pipeline = this.client.pipeline();
        for (const [key, value] of Object.entries(data)) {
            pipeline.sadd(`${this.buildKey(key)}:set`, ...value);
        }
        await pipeline.exec();
    }
    async addToRelationship(to, keys) {
        await this.client.sadd(`${this.buildKey(to)}:set`, ...(Array.isArray(keys) ? keys : [keys]));
    }
    async removeToRelationship(to, keys) {
        await this.client.srem(`${this.buildKey(to)}:set`, ...(Array.isArray(keys) ? keys : [keys]));
    }
    async removeRelationship(to) {
        await this.client.del(...(Array.isArray(to) ? to.map(x => `${this.buildKey(x)}:set`) : [`${this.buildKey(to)}:set`]));
    }
    buildKey(key) {
        return key.startsWith(this.namespace) ? key : `${this.namespace}:${key}`;
    }
}
exports.RedisAdapter = RedisAdapter;
const isObject = (o) => {
    return !!o && typeof o === 'object' && !Array.isArray(o);
};
function toNormal(target) {
    if (typeof target.ARRAY_OF === 'string')
        return JSON.parse(target.ARRAY_OF).map(toNormal);
    if (!Object.keys(target).length)
        return undefined;
    const result = {};
    for (const [key, value] of Object.entries(target)) {
        if (key.startsWith('O_')) {
            result[key.slice(2)] = JSON.parse(value);
        }
        else if (key.startsWith('N_')) {
            result[key.slice(2)] = Number(value);
        }
        else if (key.startsWith('B_')) {
            result[key.slice(2)] = value === 'true';
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
function toDb(target) {
    if (Array.isArray(target))
        return { ARRAY_OF: JSON.stringify(target.map(toDb)) };
    const result = {};
    for (const [key, value] of Object.entries(target)) {
        switch (typeof value) {
            case 'boolean':
                result[`B_${key}`] = value;
                break;
            case 'number':
                result[`N_${key}`] = `${value}`;
                break;
            case 'object':
                if (Array.isArray(value)) {
                    result[`O_${key}`] = JSON.stringify(value);
                    break;
                }
                if (isObject(value)) {
                    result[`O_${key}`] = JSON.stringify(value);
                    break;
                }
                if (!Number.isNaN(value)) {
                    result[`O_${key}`] = 'null';
                    break;
                }
                result[`O_${key}`] = JSON.stringify(value);
                break;
            default:
                result[key] = value;
                break;
        }
    }
    return result;
}
