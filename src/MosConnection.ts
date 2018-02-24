import ConnectionConfig from './config/connectionConfig'
import MosSocketClient from './socket/mosSocketClient'
import MosSocketServer from './socket/mosSocketServer'
import { SocketConnectionStatus } from './socket/mosSocketEvents'

export default class MosConnection {
	private _lowerSocket: MosSocketClient
	private _upperSocket: MosSocketServer
	private _querySocket: MosSocketServer
	private _lowerBuddySocket: MosSocketClient
	private _upperBuddySocket: MosSocketServer
	private _queryBuddySocket: MosSocketServer

	private _hasBuddy: boolean

	/** */
	constructor (private conf: ConnectionConfig) {

		this._lowerSocket = new MosSocketClient(this.conf.ncs.host, this.conf.ncs.portLower, 'Lower')
		this._upperSocket = new MosSocketServer(this.conf.ncs.host, this.conf.ncs.portUpper, 'Upper')
		this._querySocket = new MosSocketServer(this.conf.ncs.host, this.conf.ncs.portQuery, 'Query')

		if (this.conf.ncsBuddy !== undefined) {
			this._hasBuddy = true
			this._lowerBuddySocket = new MosSocketClient(this.conf.ncsBuddy.host, this.conf.ncsBuddy.portLower, 'Lower')
			this._upperBuddySocket = new MosSocketServer(this.conf.ncsBuddy.host, this.conf.ncsBuddy.portUpper, 'Upper')
			this._queryBuddySocket = new MosSocketServer(this.conf.ncsBuddy.host, this.conf.ncsBuddy.portQuery, 'Query')
		}

		this._lowerSocket.on(SocketConnectionStatus.CONNECTED, data => {
			console.log(data)
		})
	}
}
