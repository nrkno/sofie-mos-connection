import { ConnectionType } from './socketConnection';
import { MosSocketClient } from '../connection/mosSocketClient';
import { MosMessage } from '../mosModel/MosMessage';
export interface ClientDescription {
    client: MosSocketClient;
    clientDescription: string;
}
/** */
export declare class NCSServerConnection {
    private _connected;
    private _id;
    private _host;
    private _timeout;
    private _mosID;
    private _debug;
    private _clients;
    private _callbackOnConnectionChange;
    private _heartBeatsTimer;
    private _heartBeatsDelay;
    constructor(id: string, host: string, mosID: string, timeout?: number, debug?: boolean);
    /** */
    registerOutgoingConnection(clientID: number, client: MosSocketClient, clientDescription: ConnectionType): void;
    createClient(clientID: number, port: number, clientDescription: ConnectionType): void;
    /** */
    removeClient(clientID: number): void;
    connect(): void;
    executeCommand(message: MosMessage): Promise<any>;
    onConnectionChange(cb: () => void): void;
    readonly connected: boolean;
    /** */
    readonly lowerPortClients: MosSocketClient[];
    /** */
    readonly upperPortClients: MosSocketClient[];
    /** */
    readonly queryPortClients: MosSocketClient[];
    dispose(): Promise<void>;
    private _sendHeartBeats();
}
