"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestMethod = void 0;
/**
 * Possible API methods to be used when doing requests
 */
var RequestMethod;
(function (RequestMethod) {
    RequestMethod["Delete"] = "DELETE";
    RequestMethod["Get"] = "GET";
    RequestMethod["Patch"] = "PATCH";
    RequestMethod["Post"] = "POST";
    RequestMethod["Put"] = "PUT";
})(RequestMethod || (exports.RequestMethod = RequestMethod = {}));
