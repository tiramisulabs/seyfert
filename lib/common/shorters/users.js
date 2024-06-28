"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersShorter = void 0;
const transformers_1 = require("../../client/transformers");
const structures_1 = require("../../structures");
const base_1 = require("./base");
class UsersShorter extends base_1.BaseShorter {
    async createDM(userId, force = false) {
        if (!force) {
            const dm = await this.client.cache.channels?.get(userId);
            if (dm)
                return dm;
        }
        const data = await this.client.proxy.users('@me').channels.post({
            body: { recipient_id: userId },
        });
        await this.client.cache.channels?.set(userId, '@me', data);
        return transformers_1.Transformers.DMChannel(this.client, data);
    }
    async deleteDM(userId, reason) {
        const res = await this.client.proxy.channels(userId).delete({ reason });
        await this.client.cache.channels?.removeIfNI(structures_1.BaseChannel.__intent__('@me'), res.id, '@me');
        return transformers_1.Transformers.DMChannel(this.client, res);
    }
    async fetch(userId, force = false) {
        return transformers_1.Transformers.User(this.client, await this.raw(userId, force));
    }
    async raw(userId, force = false) {
        if (!force) {
            const user = await this.client.cache.users?.raw(userId);
            if (user)
                return user;
        }
        const data = await this.client.proxy.users(userId).get();
        await this.client.cache.users?.patch(userId, data);
        return data;
    }
    async write(userId, body) {
        return (await this.client.users.createDM(userId)).messages.write(body);
    }
}
exports.UsersShorter = UsersShorter;
