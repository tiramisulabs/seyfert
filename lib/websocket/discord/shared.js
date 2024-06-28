"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShardSocketCloseCodes = void 0;
var ShardSocketCloseCodes;
(function (ShardSocketCloseCodes) {
    ShardSocketCloseCodes[ShardSocketCloseCodes["Shutdown"] = 3000] = "Shutdown";
    ShardSocketCloseCodes[ShardSocketCloseCodes["ZombiedConnection"] = 3010] = "ZombiedConnection";
})(ShardSocketCloseCodes || (exports.ShardSocketCloseCodes = ShardSocketCloseCodes = {}));
