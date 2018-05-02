/// <reference types="node" />
import { Socket } from 'net';
import { EventEmitter } from 'events';
import { IncomingConnectionType } from './socketConnection';
export declare class MosSocketServer extends EventEmitter {
    private _port;
    private _portDescription;
    private _socketServer;
    private _debug;
    /** */
    constructor(port: number, description: IncomingConnectionType, debug?: boolean);
    dispose(sockets: Socket[]): Promise<void[]>;
    /** */
    listen(): Promise<boolean>;
    /** */
    private _onClientConnection(socket);
    /** */
    private _onServerError(error);
    /** */
    private _onServerClose();
}
