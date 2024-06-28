"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Poll = void 0;
const common_1 = require("../common");
const Base_1 = require("./extra/Base");
class Poll extends Base_1.Base {
    channelId;
    messageId;
    expiry;
    constructor(client, data, channelId, messageId) {
        super(client);
        this.channelId = channelId;
        this.messageId = messageId;
        this.expiry = Date.parse(data.expiry);
        Object.assign(this, (0, common_1.toCamelCase)(data));
    }
    end() {
        return this.client.messages.endPoll(this.channelId, this.messageId);
    }
    getAnswerVoters(id) {
        if (!this.answers.find(x => x.answerId === id))
            throw new Error('Invalid answer id');
        return this.client.messages.getAnswerVoters(this.channelId, this.messageId, id);
    }
}
exports.Poll = Poll;
