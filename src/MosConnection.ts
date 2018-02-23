import ConnectionConfig from './config/connectionConfig'
import MosSocketClient from './socket/mosSocketClient'
import MosSocketServer from './socket/mosSocketServer'
import {SocketConnectionStatus} from './socket/mosSocketEvents'

export default class MosConnection {
  private _conf: ConnectionConfig

  private _lowerSocket: MosSocketClient
  private _upperSocket: MosSocketServer
  private _querySocket: MosSocketServer
  private _lowerBuddySocket: MosSocketClient
  private _upperBuddySocket: MosSocketServer
  private _queryBuddySocket: MosSocketServer

  private _hasBuddy: boolean

  /** */
  constructor (conf: ConnectionConfig) {
    this._conf = conf

    this._lowerSocket = new MosSocketClient(this._conf.ncs.host, this._conf.ncs.portLower, 'Lower')
    this._upperSocket = new MosSocketServer(this._conf.ncs.host, this._conf.ncs.portUpper, 'Upper')
    this._querySocket = new MosSocketServer(this._conf.ncs.host, this._conf.ncs.portQuery, 'Query')

    if (this._conf.ncsBuddy !== undefined) {
      this._hasBuddy = true
      this._lowerBuddySocket = new MosSocketClient(this._conf.ncsBuddy.host, this._conf.ncsBuddy.portLower, 'Lower')
      this._upperBuddySocket = new MosSocketServer(this._conf.ncsBuddy.host, this._conf.ncsBuddy.portUpper, 'Upper')
      this._queryBuddySocket = new MosSocketServer(this._conf.ncsBuddy.host, this._conf.ncsBuddy.portQuery, 'Query')
    }

    this._lowerSocket.on(SocketConnectionStatus.CONNECTED, () => {
    })
  }
}
