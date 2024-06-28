"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollBuilder = void 0;
const v10_1 = require("discord-api-types/v10");
const __1 = require("..");
const functions_1 = require("../structures/extra/functions");
class PollBuilder {
    data;
    constructor(data = {}) {
        this.data = data;
        this.data.layout_type = v10_1.PollLayoutType.Default;
    }
    addAnswers(...answers) {
        this.data.answers = (this.data.answers ?? []).concat(answers.flat().map(x => ({ poll_media: this.resolvedPollMedia(x) })));
        return this;
    }
    setAnswers(...answers) {
        this.data.answers = answers.flat().map(x => ({ poll_media: this.resolvedPollMedia(x) }));
        return this;
    }
    setQuestion(data) {
        this.data.question ??= {};
        const { emoji, text } = this.resolvedPollMedia(data);
        this.data.question.text = text;
        this.data.question.emoji = emoji;
        return this;
    }
    setDuration(hours) {
        this.data.duration = hours;
        return this;
    }
    allowMultiselect(value = true) {
        this.data.allow_multiselect = value;
        return this;
    }
    toJSON() {
        return { ...this.data };
    }
    resolvedPollMedia(data) {
        if (!data.emoji)
            return { text: data.text };
        const resolve = (0, functions_1.resolvePartialEmoji)(data.emoji);
        if (!resolve)
            return (0, __1.throwError)('Invalid Emoji');
        return { text: data.text, emoji: resolve };
    }
}
exports.PollBuilder = PollBuilder;
