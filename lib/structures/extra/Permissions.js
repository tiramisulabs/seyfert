"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsBitField = void 0;
const v10_1 = require("discord-api-types/v10");
const BitField_1 = require("./BitField");
class PermissionsBitField extends BitField_1.BitField {
    Flags = v10_1.PermissionFlagsBits;
    static All = Object.values(v10_1.PermissionFlagsBits).reduce((acc, value) => acc | value, 0n);
    has(...bits) {
        return super.has(...bits) || super.has('Administrator');
    }
    strictHas(...bits) {
        return super.has(...bits);
    }
}
exports.PermissionsBitField = PermissionsBitField;
