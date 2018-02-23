import ConnectionConfig from './config/connectionConfig'
import MosSocketClient from './socket/mosSocketClient'
import MosSocketServer from './socket/mosSocketServer'

export default class MosConnection {
  private _conf: ConnectionConfig

  private _lowerSocket: MosSocketClient
  private _upperSocket: MosSocketServer
  private _querySocket: MosSocketServer

  /** */
  constructor (conf: ConnectionConfig) {
    this._conf = conf
    console.log(this._conf, this._lowerSocket, this._upperSocket, this._querySocket)
  }
}
