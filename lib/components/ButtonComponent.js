"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKUButtonComponent = exports.ButtonComponent = exports.LinkButtonComponent = void 0;
const builders_1 = require("../builders");
const BaseComponent_1 = require("./BaseComponent");
class LinkButtonComponent extends BaseComponent_1.BaseComponent {
    get style() {
        return this.data.style;
    }
    get url() {
        return this.data.url;
    }
    get label() {
        return this.data.label;
    }
    get disabled() {
        return this.data.disabled;
    }
    get emoji() {
        return this.data.emoji;
    }
    toBuilder() {
        return new builders_1.Button(this.data);
    }
}
exports.LinkButtonComponent = LinkButtonComponent;
class ButtonComponent extends BaseComponent_1.BaseComponent {
    get style() {
        return this.data.style;
    }
    get customId() {
        return this.data.custom_id;
    }
    get label() {
        return this.data.label;
    }
    get disabled() {
        return this.data.disabled;
    }
    get emoji() {
        return this.data.emoji;
    }
    toBuilder() {
        return new builders_1.Button(this.data);
    }
}
exports.ButtonComponent = ButtonComponent;
class SKUButtonComponent extends BaseComponent_1.BaseComponent {
    get style() {
        return this.data.style;
    }
    get skuId() {
        return this.data.sku_id;
    }
    get disabled() {
        return this.data.disabled;
    }
    toBuilder() {
        return new builders_1.Button(this.data);
    }
}
exports.SKUButtonComponent = SKUButtonComponent;
