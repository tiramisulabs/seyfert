"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringSelectMenuComponent = void 0;
const BaseSelectMenuComponent_1 = require("./BaseSelectMenuComponent");
class StringSelectMenuComponent extends BaseSelectMenuComponent_1.BaseSelectMenuComponent {
    get options() {
        return this.data.options;
    }
}
exports.StringSelectMenuComponent = StringSelectMenuComponent;
