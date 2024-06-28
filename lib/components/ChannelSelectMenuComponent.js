"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelSelectMenuComponent = void 0;
const BaseSelectMenuComponent_1 = require("./BaseSelectMenuComponent");
class ChannelSelectMenuComponent extends BaseSelectMenuComponent_1.BaseSelectMenuComponent {
    get channelsTypes() {
        return this.data.channel_types;
    }
    get defaultValues() {
        return this.data.default_values;
    }
}
exports.ChannelSelectMenuComponent = ChannelSelectMenuComponent;
