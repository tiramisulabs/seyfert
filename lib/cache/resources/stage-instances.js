"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StageInstances = void 0;
const guild_related_1 = require("./default/guild-related");
class StageInstances extends guild_related_1.GuildRelatedResource {
    namespace = 'stage_instance';
    //@ts-expect-error
    filter(data, id, guild_id) {
        return true;
    }
}
exports.StageInstances = StageInstances;
