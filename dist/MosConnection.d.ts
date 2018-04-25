import { IConnectionConfig, IProfiles } from './config/connectionConfig';
import { IMosConnection, IMOSDeviceConnectionOptions } from './api';
import { MosDevice } from './MosDevice';
import { NCSServerConnection } from './connection/NCSServerConnection';
export declare class MosConnection implements IMosConnection {
    static CONNECTION_PORT_LOWER: number;
    static CONNECTION_PORT_UPPER: number;
    static CONNECTION_PORT_QUERY: number;
    static _nextSocketID: number;
    private _conf;
    private _debug;
    private _lowerSocketServer;
    private _upperSocketServer;
    private _querySocketServer;
    private _incomingSockets;
    private _ncsConnections;
    private _mosDevices;
    private _isListening;
    private _onconnection;
    /** */
    constructor(configOptions: IConnectionConfig);
    /** */
    connect(connectionOptions: IMOSDeviceConnectionOptions): Promise<MosDevice>;
    onConnection(cb: (mosDevice: MosDevice) => void): void;
    registerMosDevice(myMosID: string, theirMosId0: string, theirMosId1: string | null, primary: NCSServerConnection | null, secondary: NCSServerConnection | null): MosDevice;
    /** */
    readonly isListening: Promise<boolean[]>;
    /** */
    readonly isCompliant: boolean;
    /** */
    readonly acceptsConnections: boolean;
    /** */
    readonly profiles: IProfiles;
    /** */
    dispose(): Promise<void>;
    /** */
    readonly complianceText: string;
    /** */
    private _initiateIncomingConnections();
    /** */
    private _registerIncomingClient(e);
    /** */
    private _disposeIncomingSocket(socketID);
    private static readonly nextSocketID;
}
