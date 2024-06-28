"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBase = void 0;
const Base_1 = require("./Base");
const functions_1 = require("./functions");
class DiscordBase extends Base_1.Base {
    id;
    constructor(client, 
    /** Unique ID of the object */
    data) {
        super(client);
        this.id = data.id;
        this.__patchThis(data);
    }
    /**
     * Create a timestamp for the current object.
     */
    get createdTimestamp() {
        return Number((0, functions_1.snowflakeToTimestamp)(this.id));
    }
    /**
     * createdAt gets the creation Date instace of the current object.
     */
    get createdAt() {
        return new Date(this.createdTimestamp);
    }
}
exports.DiscordBase = DiscordBase;
