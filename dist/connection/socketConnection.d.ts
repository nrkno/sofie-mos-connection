/// <reference types="node" />
import { Socket } from 'net';
/** */
export declare enum SocketConnectionEvent {
    CONNECTED = "eventsocketconnectionconnected",
    DISCONNECTED = "eventsocketconnectiondisconnected",
    DISPOSED = "eventsocketconnectiondisposed",
    TIMEOUT = "eventsocketconnectiontimeout",
    ALIVE = "eventsocketconnectionalive",
    REGISTER = "eventsocketconnectionregister",
    UNREGISTER = "eventsocketconnectionunregister",
}
/** */
export declare enum SocketServerEvent {
    CLIENT_CONNECTED = "eventsocketserverclientconnected",
}
/** */
export declare type ConnectionType = IncomingConnectionType | OutgoingConnectionType;
export declare type IncomingConnectionType = 'lower' | 'upper' | 'query';
export declare type OutgoingConnectionType = 'lower' | 'upper';
/** */
export declare type SocketDescription = {
    socket: Socket;
    portDescription: ConnectionType;
    chunks: string;
};
