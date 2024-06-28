"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Users = void 0;
const common_1 = require("../../common");
const base_1 = require("./default/base");
const transformers_1 = require("../../client/transformers");
class Users extends base_1.BaseResource {
    namespace = 'user';
    //@ts-expect-error
    filter(data, id) {
        return true;
    }
    raw(id) {
        return super.get(id);
    }
    get(id) {
        return (0, common_1.fakePromise)(super.get(id)).then(rawUser => (rawUser ? transformers_1.Transformers.User(this.client, rawUser) : undefined));
    }
    bulk(ids) {
        return (0, common_1.fakePromise)(super.bulk(ids)).then(users => users.map(rawUser => transformers_1.Transformers.User(this.client, rawUser)));
    }
    bulkRaw(ids) {
        return super.bulk(ids);
    }
    values() {
        return (0, common_1.fakePromise)(super.values()).then(users => users.map(rawUser => transformers_1.Transformers.User(this.client, rawUser)));
    }
    valuesRaw() {
        return super.values();
    }
}
exports.Users = Users;
