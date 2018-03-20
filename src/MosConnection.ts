import { Socket } from 'net'
import { ConnectionConfig, ProfilesSupport } from './config/connectionConfig'
import { MosSocketServer } from './connection/mosSocketServer'
import {
	IMosConnection,
	IMOSDeviceConnectionOptions,
	IMOSDevice
} from './api'
import { SocketServerEvent, SocketDescription } from './connection/socketConnection'
import { Server } from './connection/Server'

export class MosConnection implements IMosConnection {
	static CONNECTION_PORT_LOWER: number = 10540
	static CONNECTION_PORT_UPPER: number = 10541
	static CONNECTION_PORT_QUERY: number = 10542
	static _nextSocketID: number = 0

	private _conf: ConnectionConfig

	private _lowerSocketServer: MosSocketServer
	private _upperSocketServer: MosSocketServer
	private _querySocketServer: MosSocketServer
	private _servers: {[host: string]: Server} = {}

	private _isListening: Promise<boolean[]>

	private _onconnection: (mosDevice: IMOSDevice) => void

	/** */
	constructor (config: ConnectionConfig) {
		this._conf = config

		if (this._conf.acceptsConnections) {
			this._isListening = this._initiateIncomingConnections()
		}
	}

	/** */
	connect (connectionOptions: IMOSDeviceConnectionOptions): Promise<IMOSDevice> {
		// @todo: implement this

		return new Promise((resolve) => {

			// connect to mos device

			// initialize mosDevice:
			// let mosDevice = new MosDevice() // pseudo-code here, put something real
			let mosDevice = {
				onRequestMOSObject () {},
				onRequestAllMOSObjects () {},
				getMOSObject () {},
				getAllMOSObjects () {}
			}

			// emit to .onConnection
			if (this._onconnection) this._onconnection(mosDevice)

			resolve(mosDevice)

		})
	}
	onConnection (cb: (mosDevice: IMOSDevice) => void) {
		this._onconnection = cb
	}

	/** */
	get isListening (): Promise<boolean[]> {
		return this._isListening || Promise.reject(`Mos connection is not listening for connections. "Config.acceptsConnections" is "${this._conf.acceptsConnections}"`)
	}

	/** */
	get isCompliant (): boolean {
		return false
	}

	/** */
	get acceptsConnections (): boolean {
		return this._conf.acceptsConnections
	}

	/** */
	get profiles (): ProfilesSupport {
		return this._conf.profiles
	}

	/** */
	dispose (): Promise<void> {
		let lowerSockets: Socket[] = []
		let upperSockets: Socket[] = []
		let querySockets: Socket[] = []

		for (let nextSocketID in this._servers) {
			let server = this._servers[nextSocketID]
			lowerSockets = lowerSockets.concat(server.lowerPortSockets)
			upperSockets = upperSockets.concat(server.upperPortSockets)
			querySockets = querySockets.concat(server.queryPortSockets)
		}

		let disposing: Promise<void>[] = []
		if (this._lowerSocketServer) {
			disposing.push(this._lowerSocketServer.dispose(lowerSockets))
		}
		if (this._upperSocketServer) {
			disposing.push(this._upperSocketServer.dispose(upperSockets))
		}
		if (this._querySocketServer) {
			disposing.push(this._querySocketServer.dispose(querySockets))
		}

		return new Promise((resolveDispose) => {
			Promise.all(disposing)
			.then(() => resolveDispose())
		})
		// @todo: all outgoing clients
	}

	/** */
	get complianceText (): string {
		if (this.isCompliant) {
			let profiles: string[] = []
			for (let nextSocketID in this._conf.profiles) {
				if (this._conf.profiles[nextSocketID] === true) {
					profiles.push(nextSocketID)
				}
			}

			return `MOS Compatible – Profiles ${profiles.join(',')}`
		}
		return 'Warning: Not MOS compatible'
	}

	/** */
	private _initiateIncomingConnections (): Promise<boolean[]> {
		// shouldn't accept connections, so won't rig socket servers
		if (!this._conf.acceptsConnections) {
			return Promise.reject(false)
		}

		// setup two socket servers, then resolve with their listening statuses
		return new Promise((resolveDispose) => {
			this._lowerSocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_LOWER, 'lower')
			this._upperSocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_UPPER, 'upper')
			this._querySocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_QUERY, 'query')

			this._lowerSocketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))
			this._upperSocketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))
			this._querySocketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))

			Promise.all(
				[
					this._lowerSocketServer.listen(),
					this._upperSocketServer.listen(),
					this._querySocketServer.listen()
				]
			)
			.then(result => resolveDispose(result))
		})
	}

	/** */
	private _registerIncomingClient (e: SocketDescription) {
		let socketID = MosConnection.nextSocketID

		// handles socket listeners
		e.socket.on('close', (/*hadError: boolean*/) => this._disposeIncomingSocket(e.socket, socketID))
		e.socket.on('data', (data: string) => console.log(`Socket got data (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${data}`))
		e.socket.on('error', (error: Error) => console.log(`Socket had error (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${error}`))

		// registers socket on server
		let server: Server = this._getServerForHost(e.socket.remoteAddress)
		server.registerIncomingConnection(socketID, e.socket, e.portDescription)
		console.log('added: ', this._servers)
	}

	/** */
	private _disposeIncomingSocket (socket: Socket, socketID: number) {
		socket.removeAllListeners()
		socket.destroy()
		this._getServerForHost(socket.remoteAddress).removeSocket(socketID)
		console.log('removed: ', this._servers, '\n')
	}

	/** */
	private _getServerForHost (host: string): Server {
		// create new server if not known
		if (!this._servers[host]) {
			this._servers[host] = new Server()
		}

		return this._servers[host]
	}

	private static get nextSocketID (): number {
		return this._nextSocketID++
	}
}
