"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPMethods = exports.OK_STATUS_CODES = exports.GATEWAY_BASE_URL = exports.BASE_HOST = exports.BASE_URL = exports.API_VERSION = void 0;
exports.API_VERSION = '10';
exports.BASE_URL = `/api/v${exports.API_VERSION}`;
exports.BASE_HOST = `https://discord.com`;
exports.GATEWAY_BASE_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
exports.OK_STATUS_CODES = [200, 201, 204, 304];
var HTTPMethods;
(function (HTTPMethods) {
    HTTPMethods["Delete"] = "DELETE";
    HTTPMethods["Get"] = "GET";
    HTTPMethods["Patch"] = "PATCH";
    HTTPMethods["Post"] = "POST";
    HTTPMethods["Put"] = "PUT";
})(HTTPMethods = exports.HTTPMethods || (exports.HTTPMethods = {}));
