"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientUser = void 0;
const User_1 = require("./User");
class ClientUser extends User_1.User {
    application;
    bot = true;
    constructor(client, data, application) {
        super(client, data);
        this.application = application;
    }
    async fetch() {
        const data = await this.api.users('@me').get();
        return new ClientUser(this.client, data, this.application);
    }
    async edit(body) {
        const data = await this.api.users('@me').patch({ body });
        return new ClientUser(this.client, data, this.application);
    }
}
exports.ClientUser = ClientUser;
