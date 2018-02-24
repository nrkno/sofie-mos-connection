export enum SocketConnectionStatus {
  CONNECTED = 'socketconnectionstatusconnected',
  DISCONNECTED = 'socketconnectionstatusdisconnected',
  DISPOSED = 'socketconnectionstatusdestroyed',
  TIMEOUT = 'socketconnectionstatustimeout',
  ALIVE= 'socketconnectionstatusalive'
}

export enum SocketServerConnectionStatus {
  LISTENING = 'socketserverconnectionstatuslistening',
  DISPOSED = 'socketserverconnectionstatusdestroyed',
  ALIVE= 'socketserverconnectionstatusalive'
}
