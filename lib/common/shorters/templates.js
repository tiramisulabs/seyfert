"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateShorter = void 0;
const base_1 = require("./base");
const transformers_1 = require("../../client/transformers");
class TemplateShorter extends base_1.BaseShorter {
    fetch(code) {
        return this.client.proxy.guilds
            .templates(code)
            .get()
            .then(template => transformers_1.Transformers.GuildTemplate(this.client, template));
    }
    list(guildId) {
        return this.client.proxy
            .guilds(guildId)
            .templates.get()
            .then(list => list.map(template => transformers_1.Transformers.GuildTemplate(this.client, template)));
    }
    create(guildId, body) {
        return this.client.proxy
            .guilds(guildId)
            .templates.post({ body })
            .then(template => transformers_1.Transformers.GuildTemplate(this.client, template));
    }
    sync(guildId, code) {
        return this.client.proxy
            .guilds(guildId)
            .templates(code)
            .put({})
            .then(template => transformers_1.Transformers.GuildTemplate(this.client, template));
    }
    edit(guildId, code, body) {
        return this.client.proxy
            .guilds(guildId)
            .templates(code)
            .patch({ body })
            .then(template => transformers_1.Transformers.GuildTemplate(this.client, template));
    }
    delete(guildId, code) {
        return this.client.proxy
            .guilds(guildId)
            .templates(code)
            .delete()
            .then(template => transformers_1.Transformers.GuildTemplate(this.client, template));
    }
}
exports.TemplateShorter = TemplateShorter;
