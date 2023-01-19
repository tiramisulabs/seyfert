"use strict";
/**
 * refactor
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheAdapter = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class RedisCacheAdapter {
    constructor(options) {
        this.options = Object.assign(RedisCacheAdapter.DEFAULTS, options);
        if (this.options.client) {
            this.client = this.options.client;
        }
        else {
            const { ...redisOpt } = this.options;
            this.client = new ioredis_1.default(redisOpt);
        }
    }
    /**
     * @inheritDoc
     */
    async get(id) {
        const data = await this.client.get(this.build(id));
        if (!data) {
            return null;
        }
        return JSON.parse(data);
    }
    /**
     * @inheritDoc
     */
    async set(id, data) {
        const expire = this.options.expire;
        if (expire) {
            await this.client.set(this.build(id), JSON.stringify(data), 'EX', expire);
        }
        else {
            await this.client.set(this.build(id), JSON.stringify(data));
        }
    }
    /**
     * @inheritDoc
     */
    async items(to) {
        const array = [];
        let data = await this.getToRelationship(to);
        data = data.map(id => this.build(`${to}.${id}`));
        if (data && data.length > 0) {
            const items = await this.client.mget(data);
            for (const item of items) {
                if (item) {
                    array.push(JSON.parse(item));
                }
            }
        }
        return array;
    }
    /**
     * @inheritDoc
     */
    async count(to) {
        return new Promise((resolve, reject) => {
            this.client.scard(this.build(to), (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result || 0);
            });
        });
    }
    /**
     * @inheritDoc
     */
    async remove(id) {
        await this.client.del(this.build(id));
    }
    /**
     * @inheritDoc
     */
    async contains(to, id) {
        return new Promise((resolve, reject) => {
            this.client.sismember(this.build(to), id, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result === 1);
            });
        });
    }
    /**
     * @inheritDoc
     */
    async getToRelationship(to) {
        return new Promise((resolve, reject) => {
            this.client.smembers(this.build(to), (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve(result || []);
            });
        });
    }
    /**
     * @inheritDoc
     */
    async addToRelationship(to, id) {
        return new Promise((resolve, reject) => {
            this.client.sadd(this.build(to), id, err => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }
    /**
     * @inheritDoc
     */
    async removeToRelationship(to, id) {
        return new Promise((resolve, reject) => {
            this.client.srem(this.build(to), id, err => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }
    /**
     * @inheritDoc
     */
    build(id) {
        return `${this.options.namespace}:${id}`;
    }
}
exports.RedisCacheAdapter = RedisCacheAdapter;
RedisCacheAdapter.DEFAULTS = {
    namespace: 'biscuitland',
};
