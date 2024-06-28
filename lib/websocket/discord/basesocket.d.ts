import NodeWebSocket from 'ws';
export declare class BaseSocket {
    private internal;
    constructor(kind: 'ws' | 'bun', url: string);
    set onopen(callback: NodeWebSocket['onopen']);
    set onmessage(callback: NodeWebSocket['onmessage']);
    set onclose(callback: NodeWebSocket['onclose']);
    set onerror(callback: NodeWebSocket['onerror']);
    send(data: string): void;
    close(...args: Parameters<NodeWebSocket['close']>): void;
    ping(): Promise<number>;
    get readyState(): number;
}
