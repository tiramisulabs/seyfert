"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseContext = void 0;
class BaseContext {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Gets the proxy object.
     */
    get proxy() {
        return this.client.proxy;
    }
    isChat() {
        return false;
    }
    isMenu() {
        return false;
    }
    isMenuUser() {
        return false;
    }
    isMenuMessage() {
        return false;
    }
    isComponent() {
        return false;
    }
    isModal() {
        return false;
    }
    isButton() {
        return false;
    }
    isChannelSelectMenu() {
        return false;
    }
    isRoleSelectMenu() {
        return false;
    }
    isMentionableSelectMenu() {
        return false;
    }
    isUserSelectMenu() {
        return false;
    }
    isStringSelectMenu() {
        return false;
    }
}
exports.BaseContext = BaseContext;
