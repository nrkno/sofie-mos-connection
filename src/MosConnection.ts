import ConnectionConfig from './config/connectionConfig'
import MosSocketClient from './socket/mosSocketClient'
import MosSocketServer from './socket/mosSocketServer'
import {SocketConnectionStatus} from './socket/mosSocketEvents'

const PORT_LOWER:number = 10540;
const PORT_UPPER:number = 10541;
const PORT_QUERY:number = 10542;

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

    this._lowerSocket = new MosSocketClient(this._conf.ncs.host, MosConnection.portLower, 'Lower')
    this._upperSocket = new MosSocketServer(MosConnection.portUpper, 'Upper')
    this._querySocket = new MosSocketServer(MosConnection.portQuery, 'Query')

    if (this._conf.ncsBuddy !== undefined) {
      this._hasBuddy = true
      this._lowerBuddySocket = new MosSocketClient(this._conf.ncsBuddy.host, MosConnection.portLower, 'Lower')
      this._upperBuddySocket = new MosSocketServer(MosConnection.portUpper, 'Upper')
      this._queryBuddySocket = new MosSocketServer(MosConnection.portQuery, 'Query')
    }

    this._lowerSocket.on(SocketConnectionStatus.CONNECTED, () => {
    })
  }

  static get portLower():number {
    return PORT_LOWER;
  }
  static get portUpper():number {
    return PORT_UPPER;
  }
  static get portQuery():number {
    return PORT_QUERY;
  }
}
