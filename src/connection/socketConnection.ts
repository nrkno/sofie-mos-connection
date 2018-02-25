import {Socket} from 'net';

/** */
export interface IConnection {
  id: number
  connectionID: ConnectionType
  socket: Socket
}

/** */
export interface IIncomingConnection extends IConnection {
  
}

/** */
export interface IOutgoingConnection extends IConnection {

}

/** */
export enum SocketConnectionEvent {
  CONNECTED = 'eventsocketconnectionconnected',
  DISCONNECTED = 'eventsocketconnectiondisconnected',
  DISPOSED = 'eventsocketconnectiondisposed',
  TIMEOUT = 'eventsocketconnectiontimeout',
  ALIVE = 'eventsocketconnectionalive',
  REGISTER = 'eventsocketconnectionregister',
  UNREGISTER = 'eventsocketconnectionunregister'
}

/** */
export enum SocketServerEvent {
  LISTENING = 'eventsocketserverlistening',
  DISPOSED = 'eventsocketserverdisposed',
  ALIVE = 'eventsocketserveralive'
}

/** */
export type ConnectionType = IncomingConnectionType | OutgoingConnectionType
export type IncomingConnectionType = 'upper' | 'query'
export type  OutgoingConnectionType = 'lower'
