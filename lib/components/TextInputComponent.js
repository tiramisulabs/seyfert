"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextInputComponent = void 0;
const BaseComponent_1 = require("./BaseComponent");
class TextInputComponent extends BaseComponent_1.BaseComponent {
    get customId() {
        return this.data.custom_id;
    }
    get value() {
        return this.data.value;
    }
    get style() {
        return this.data.style;
    }
    get label() {
        return this.data.label;
    }
    get max() {
        return this.data.max_length;
    }
    get min() {
        return this.data.min_length;
    }
    get required() {
        return this.data.required;
    }
    get placeholder() {
        return this.data.placeholder;
    }
}
exports.TextInputComponent = TextInputComponent;
