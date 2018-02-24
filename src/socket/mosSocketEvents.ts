export enum SocketConnectionStatus {
  CONNECTED = 'socketconnectionstatusconnected',
  DISCONNECTED = 'socketconnectionstatusdisconnected',
  DISPOSED = 'socketconnectionstatusdestroyed',
  TIMEOUT = 'socketconnectionstatustimeout'
}

export enum SocketServerConnectionStatus {
  LISTENING = 'socketserverconnectionstatuslistening',
  DISPOSED = 'socketserverconnectionstatusdestroyed'
}
