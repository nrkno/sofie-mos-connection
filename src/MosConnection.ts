import {ConnectionConfig} from './config/connectionConfig'
import {MosSocketClient} from './socket/mosSocketClient'
import {MosSocketServer} from './socket/mosSocketServer'
import {SocketConnectionStatus, SocketServerConnectionStatus} from './socket/mosSocketEvents'
import {MosMessage} from './mosModel/MosMessage'
import {HeartBeat} from './mosModel/0_heartBeat'
import Timer = NodeJS.Timer

export class MosConnection {
  static PORT_LOWER: number = 10540
  static PORT_UPPER: number = 10541
  static PORT_QUERY: number = 10542
  static KEEP_ALIVE_INTERVAL: number = 5000 // time in ms between last sign of server being alive, before sending heartbeat

  private _conf: ConnectionConfig

  private _lowerSocket: MosSocketClient
  private _upperSocket: MosSocketServer
  private _querySocket: MosSocketServer
  private _lowerSocketBuddy: MosSocketClient
  private _upperSocketBuddy: MosSocketServer
  private _querySocketBuddy: MosSocketServer

  private _lastSeen: number
  private _lastSeenBuddy: number
  private _lastSeenTimeout: Timer
  private _lastSeenTimeoutBuddy: Timer

  /** */
  constructor (conf: ConnectionConfig) {

    this._conf = conf

    // creates socket- clients and server
    this._lowerSocket = new MosSocketClient(this._conf.ncs.host, MosConnection.PORT_LOWER, 'Lower')
    this._upperSocket = new MosSocketServer(MosConnection.PORT_UPPER, 'Upper')
    this._querySocket = new MosSocketServer(MosConnection.PORT_QUERY, 'Query')

    // logs any sign on the primary server being alive for heartbeat throtling and failover management
    this._lowerSocket.on(SocketConnectionStatus.ALIVE, () => this.lastSeen = Date.now())
    this._upperSocket.on(SocketServerConnectionStatus.ALIVE, () => this.lastSeen = Date.now())
    this._querySocket.on(SocketServerConnectionStatus.ALIVE, () => this.lastSeen = Date.now())

    // connects Lower-port socket client
    this._lowerSocket.on(SocketConnectionStatus.CONNECTED, () => {
      this._sendHeartBeat('primary')
    })
    this._lowerSocket.connect()

    // creates socket- clients and server for Buddy connection, if configured
    if (this._conf.ncsBuddy !== undefined) {
      this._lowerSocketBuddy = new MosSocketClient(this._conf.ncsBuddy.host, MosConnection.PORT_LOWER, 'Lower')
      this._upperSocketBuddy = new MosSocketServer(MosConnection.PORT_UPPER, 'Upper')
      this._querySocketBuddy = new MosSocketServer(MosConnection.PORT_QUERY, 'Query')

      // logs any sign on the buddy server being alive for heartbeat throtling and failover management
      this._lowerSocketBuddy.on(SocketConnectionStatus.ALIVE, () => this.lastSeenBuddy = Date.now())
      this._upperSocketBuddy.on(SocketServerConnectionStatus.ALIVE, () => this.lastSeenBuddy = Date.now())
      this._querySocketBuddy.on(SocketServerConnectionStatus.ALIVE, () => this.lastSeenBuddy = Date.now())

      // connects Lower-port socket client
      this._lowerSocketBuddy.on(SocketConnectionStatus.CONNECTED, () => {
        this._sendHeartBeat('buddy')
      })
      this._lowerSocketBuddy.connect()
    }
  }

  /** */
  sendLowerCommand (message: MosMessage) {
    message.ncsID = this._conf.ncs.ncsID
    message.mosID = this._conf.mosID
    this._lowerSocket.executeCommand(message)
  }

  /** */
  set lastSeen (timestamp: number) {
    this._lastSeen = timestamp

    clearTimeout(this._lastSeenTimeout)
    delete this._lastSeenTimeout

    this._lastSeenTimeout = setTimeout(() => { this._sendHeartBeat('primary') }, MosConnection.KEEP_ALIVE_INTERVAL)
  }

  /** */
  set lastSeenBuddy (timestamp: number) {
    this._lastSeenBuddy = timestamp

    clearTimeout(this._lastSeenTimeoutBuddy)
    delete this._lastSeenTimeoutBuddy

    this._lastSeenTimeoutBuddy = setTimeout(() => { this._sendHeartBeat('buddy') }, MosConnection.KEEP_ALIVE_INTERVAL)
  }

  /** */
  private _sendHeartBeat (server: 'primary' | 'buddy') {
    console.log('timeout for', server)

    // @todo: log that we needed to send heartbeat, respond if it doesn't come back within reason

    let heartbeat = new HeartBeat()

    if (server === 'primary') {
      // is primary
      delete this._lastSeenTimeout
      heartbeat.ncsID = this._conf.ncs.ncsID
      heartbeat.mosID = this._conf.mosID
      this._lowerSocket.executeCommand(heartbeat)
    }else if (this._conf.ncsBuddy !== undefined && server === 'buddy') {
      // is buddy
      delete this._lastSeenTimeoutBuddy
      heartbeat.ncsID = this._conf.ncsBuddy.ncsID
      heartbeat.mosID = this._conf.mosID
      this._lowerSocket.executeCommand(heartbeat)
    }
  }
}
