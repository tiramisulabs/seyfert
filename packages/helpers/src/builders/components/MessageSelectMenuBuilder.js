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
var _SelectMenuOptionBuilder_data, _SelectMenuBuilder_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectMenuBuilder = exports.SelectMenuOptionBuilder = void 0;
const api_types_1 = require("@biscuitland/api-types");
class SelectMenuOptionBuilder {
    constructor() {
        _SelectMenuOptionBuilder_data.set(this, void 0);
        __classPrivateFieldSet(this, _SelectMenuOptionBuilder_data, {}, "f");
    }
    setLabel(label) {
        __classPrivateFieldGet(this, _SelectMenuOptionBuilder_data, "f").label = label;
        return this;
    }
    setValue(value) {
        __classPrivateFieldGet(this, _SelectMenuOptionBuilder_data, "f").value = value;
        return this;
    }
    setDescription(description) {
        __classPrivateFieldGet(this, _SelectMenuOptionBuilder_data, "f").description = description;
        return this;
    }
    setDefault(Default = true) {
        __classPrivateFieldGet(this, _SelectMenuOptionBuilder_data, "f").default = Default;
        return this;
    }
    setEmoji(emoji) {
        __classPrivateFieldGet(this, _SelectMenuOptionBuilder_data, "f").emoji = emoji;
        return this;
    }
    toJSON() {
        return { ...__classPrivateFieldGet(this, _SelectMenuOptionBuilder_data, "f") };
    }
}
exports.SelectMenuOptionBuilder = SelectMenuOptionBuilder;
_SelectMenuOptionBuilder_data = new WeakMap();
class SelectMenuBuilder {
    constructor() {
        _SelectMenuBuilder_data.set(this, void 0);
        __classPrivateFieldSet(this, _SelectMenuBuilder_data, {}, "f");
        this.type = api_types_1.MessageComponentTypes.SelectMenu;
        this.options = [];
    }
    setType(type) {
        this.type = type;
        return this;
    }
    setPlaceholder(placeholder) {
        __classPrivateFieldGet(this, _SelectMenuBuilder_data, "f").placeholder = placeholder;
        return this;
    }
    setValues(max, min) {
        __classPrivateFieldGet(this, _SelectMenuBuilder_data, "f").max_values = max;
        __classPrivateFieldGet(this, _SelectMenuBuilder_data, "f").min_values = min;
        return this;
    }
    setDisabled(disabled = true) {
        __classPrivateFieldGet(this, _SelectMenuBuilder_data, "f").disabled = disabled;
        return this;
    }
    setCustomId(id) {
        __classPrivateFieldGet(this, _SelectMenuBuilder_data, "f").custom_id = id;
        return this;
    }
    setOptions(...options) {
        this.options.splice(0, this.options.length, ...options);
        return this;
    }
    addOptions(...options) {
        this.options.push(...options);
        return this;
    }
    toJSON() {
        return { ...__classPrivateFieldGet(this, _SelectMenuBuilder_data, "f"), type: this.type, options: this.options.map(option => option.toJSON()) };
    }
}
exports.SelectMenuBuilder = SelectMenuBuilder;
_SelectMenuBuilder_data = new WeakMap();
