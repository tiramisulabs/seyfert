"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleSelectMenuComponent = void 0;
const BaseSelectMenuComponent_1 = require("./BaseSelectMenuComponent");
class RoleSelectMenuComponent extends BaseSelectMenuComponent_1.BaseSelectMenuComponent {
    get defaultValues() {
        return this.data.default_values;
    }
}
exports.RoleSelectMenuComponent = RoleSelectMenuComponent;
