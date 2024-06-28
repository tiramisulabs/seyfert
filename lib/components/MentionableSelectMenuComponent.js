"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentionableSelectMenuComponent = void 0;
const BaseSelectMenuComponent_1 = require("./BaseSelectMenuComponent");
class MentionableSelectMenuComponent extends BaseSelectMenuComponent_1.BaseSelectMenuComponent {
    get defaultValues() {
        return this.data.default_values;
    }
}
exports.MentionableSelectMenuComponent = MentionableSelectMenuComponent;
