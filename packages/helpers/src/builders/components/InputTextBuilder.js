"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _InputTextBuilder_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputTextBuilder = void 0;
const api_types_1 = require("@biscuitland/api-types");
class InputTextBuilder {
    constructor() {
        _InputTextBuilder_data.set(this, void 0);
        __classPrivateFieldSet(this, _InputTextBuilder_data, {}, "f");
        this.type = api_types_1.MessageComponentTypes.InputText;
    }
    setStyle(style) {
        __classPrivateFieldGet(this, _InputTextBuilder_data, "f").style = style;
        return this;
    }
    setLabel(label) {
        __classPrivateFieldGet(this, _InputTextBuilder_data, "f").label = label;
        return this;
    }
    setPlaceholder(placeholder) {
        __classPrivateFieldGet(this, _InputTextBuilder_data, "f").placeholder = placeholder;
        return this;
    }
    setLength(max, min) {
        __classPrivateFieldGet(this, _InputTextBuilder_data, "f").max_length = max;
        __classPrivateFieldGet(this, _InputTextBuilder_data, "f").min_length = min;
        return this;
    }
    setCustomId(id) {
        __classPrivateFieldGet(this, _InputTextBuilder_data, "f").custom_id = id;
        return this;
    }
    setValue(value) {
        __classPrivateFieldGet(this, _InputTextBuilder_data, "f").value = value;
        return this;
    }
    setRequired(required = true) {
        __classPrivateFieldGet(this, _InputTextBuilder_data, "f").required = required;
        return this;
    }
    toJSON() {
        return { ...__classPrivateFieldGet(this, _InputTextBuilder_data, "f"), type: this.type };
    }
}
exports.InputTextBuilder = InputTextBuilder;
_InputTextBuilder_data = new WeakMap();
