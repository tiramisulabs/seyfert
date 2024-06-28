"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseSelectMenuComponent = void 0;
const BaseComponent_1 = require("./BaseComponent");
class BaseSelectMenuComponent extends BaseComponent_1.BaseComponent {
    get customId() {
        return this.data.custom_id;
    }
    get disabed() {
        return this.data.disabled;
    }
    get max() {
        return this.data.max_values;
    }
    get min() {
        return this.data.min_values;
    }
    get placeholder() {
        return this.data.placeholder;
    }
}
exports.BaseSelectMenuComponent = BaseSelectMenuComponent;
