"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collector = void 0;
const node_events_1 = require("node:events");
class Collector extends node_events_1.EventEmitter {
    constructor(session, options) {
        super();
        this.session = session;
        this.options = options;
        this.collected = new Set();
        this.ended = false;
        if (!('filter' in this.options)) {
            this.options.filter = (() => true);
        }
        if (!('max' in this.options)) {
            this.options.max = -1;
        }
        this.session.events.setMaxListeners(this.session.events.getMaxListeners() + 1);
        this.session.events.on(this.options.event, (...args) => this.collect(...args));
        this.timeout = setTimeout(() => this.stop('time'), this.options.idle ?? this.options.time);
    }
    collect(...args) {
        if (this.options.filter?.(...args)) {
            this.collected.add(args[0]);
            this.emit('collect', ...args);
        }
        if (this.options.idle) {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.stop('time'), this.options.idle);
        }
        if (this.collected.size >= this.options.max) {
            this.stop('max');
        }
    }
    stop(reason) {
        if (this.ended) {
            return;
        }
        clearTimeout(this.timeout);
        this.session.events.removeListener(this.options.event, (...args) => this.collect(...args));
        this.session.events.setMaxListeners(this.session.events.getMaxListeners() - 1);
        this.ended = true;
        this.emit('end', reason, this.collected);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    once(event, listener) {
        return super.once(event, listener);
    }
}
exports.Collector = Collector;
