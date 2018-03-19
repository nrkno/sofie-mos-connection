import { Socket } from 'net'
import { ConnectionType, IConnection } from './socketConnection'

export class ConnectionManager {

	private _connections: {[socketID: string]: {[socketID: string]: IConnection}} = {
		lower: {},
		upper: {},
		query: {}
	}

	/** */
	register (socket: IConnection) {
		this._connections[socket.connectionID][socket.id] = socket
	}

	/** */
	unregister (socket: IConnection) {
		delete this._connections[socket.connectionID][socket.id]
	}

	/** */
	getSocketsFor (connectionID: ConnectionType): IConnection[] {
		let sockets: IConnection[] = []
		for (let i in this._connections[connectionID]) {
			sockets.push(this._connections[connectionID][i])
		}
		return sockets
	}
}
