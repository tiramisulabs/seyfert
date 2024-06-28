"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSelectMenuComponent = void 0;
const BaseSelectMenuComponent_1 = require("./BaseSelectMenuComponent");
class UserSelectMenuComponent extends BaseSelectMenuComponent_1.BaseSelectMenuComponent {
    get defaultValues() {
        return this.data.default_values;
    }
}
exports.UserSelectMenuComponent = UserSelectMenuComponent;
