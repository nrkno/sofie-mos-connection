import { Socket } from 'net'
import { ConnectionConfig, IConnectionConfig, IProfiles } from './config/connectionConfig'
import { MosSocketServer } from './connection/mosSocketServer'
import {
	IMosConnection,
	IMOSDeviceConnectionOptions,
	IMOSDevice
} from './api'
import { MosDevice } from './MosDevice'
import { SocketServerEvent, SocketDescription } from './connection/socketConnection'
import { Server } from './connection/Server'
import { NCSServerConnection } from './connection/NCSServerConnection'
import * as parser from 'xml2json'
import { ROAck } from './mosModel/ROAck'
import { MosMessage } from './mosModel/MosMessage'
const iconv = require('iconv-lite')

export class MosConnection implements IMosConnection {
	static CONNECTION_PORT_LOWER: number = 10540
	static CONNECTION_PORT_UPPER: number = 10541
	static CONNECTION_PORT_QUERY: number = 10542
	static _nextSocketID: number = 0

	private _conf: ConnectionConfig
	private _debug: boolean = false

	private _lowerSocketServer: MosSocketServer
	private _upperSocketServer: MosSocketServer
	private _querySocketServer: MosSocketServer
	private _servers: {[host: string]: Server} = {}
	private _ncsConnections: {[host: string]: NCSServerConnection} = {}
	private _mosDevices: {[mosID: string]: MosDevice} = {}

	private _isListening: Promise<boolean[]>

	private _onconnection: (mosDevice: IMOSDevice) => void

	/** */
	constructor (configOptions: IConnectionConfig) {
		this._conf = new ConnectionConfig(configOptions)

		if (this._conf.acceptsConnections) {
			this._isListening = this._initiateIncomingConnections()
		}
		if (this._conf.debug) {
			this._debug = this._conf.debug
		}
	}

	/** */
	connect (connectionOptions: IMOSDeviceConnectionOptions): Promise<IMOSDevice> {
		// @todo: implement this

		return new Promise((resolve) => {

			// connect to mos device
			// Store MosSocketClients instead of Sockets in Server?
			// Create MosSocketClients in construct?
			let primary = new NCSServerConnection(
				connectionOptions.primary.id,
				connectionOptions.primary.host,
				this._conf.mosID,
				connectionOptions.primary.timeout,
				this._debug
			)
			let secondary = null
			this._ncsConnections[connectionOptions.primary.host] = primary

			primary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_LOWER, 'lower')
			primary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_UPPER, 'upper')

			if (connectionOptions.secondary) {
				secondary = new NCSServerConnection(
					connectionOptions.secondary.id,
					connectionOptions.secondary.host,
					this._conf.mosID,
					connectionOptions.secondary.timeout,
					this._debug
				)
				this._ncsConnections[connectionOptions.secondary.host] = secondary
				secondary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_LOWER, 'lower')
				secondary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_UPPER, 'upper')
			}

			// initialize mosDevice:
			let connectionConfig = this._conf
			let mosDevice = new MosDevice(connectionConfig, primary, secondary)
			this._mosDevices[mosDevice.id] = mosDevice
			mosDevice.connect()

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
	get profiles (): IProfiles {
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

		if (this._ncsConnections) {
			for (let ncsConnection in this._ncsConnections) {
				disposing.push(this._ncsConnections[ncsConnection].dispose())
			}
		}

		return new Promise((resolveDispose) => {
			Promise.all(disposing)
			.then(() => resolveDispose())
		})
	}

	/** */
	get complianceText (): string {
		if (this.isCompliant) {
			let profiles: string[] = []
			for (let nextSocketID in this._conf.profiles) {
				// @ts-ignore will fix this correctly later
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
		// console.log('_initiateIncomingConnections')
		// shouldn't accept connections, so won't rig socket servers
		if (!this._conf.acceptsConnections) {
			// console.log('reject')
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

			// console.log('listen on all ports')
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
		e.socket.on('end', () => {
			if (this._debug) console.log('Socket End')
		})
		e.socket.on('drain', () => {
			if (this._debug) console.log('Socket Drain')
		})
		e.socket.on('data', (data: Buffer) => {
			let str = iconv.decode(data, 'utf16-be')

			if (this._debug) console.log(`Socket got data (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${data}`)

			let parsed: any = null
			let parseOptions = {
				object: true,
				coerce: true,
				trim: true
			}
			let firstMatch = '<mos>' // <mos>
			let first = str.substr(0, firstMatch.length)
			let lastMatch = '</mos>\r\n' // </mos>
			let last = str.substr(-lastMatch.length)

			// Data ready to be parsed
			if (first === firstMatch && last === lastMatch) {
				// @ts-ignore xml2json says arguments are wrong, but its not.
				parsed = parser.toJson(data, parseOptions)

			// Last chunk, ready to parse with saved data
			} else if (last === lastMatch) {
				// @ts-ignore xml2json says arguments are wrong, but its not.
				parsed = parser.toJson(e.chunks + data, parseOptions)
				e.chunks = ''

			// Chunk, save for later
			} else {
				if (e.chunks === undefined) e.chunks = ''
				e.chunks += data
			}
			if (parsed !== null) {
				let mosDevice = this._mosDevices[parsed.mos.mosID]

				let mosMessageId: number = parsed.mos.messageID // is this correct? (needs to be verified) /Johan
				let ncsID = parsed.mos.ncsID
				let mosID = parsed.mos.mosID

				let sendReply = (message: MosMessage) => {
					message.ncsID = ncsID
					message.mosID = mosID
					message.prepare(mosMessageId)
					let msgStr: string = message.toString()
					let buf = iconv.encode(msgStr, 'utf16-be')
					e.socket.write(buf, 'usc2')
				}

				if (mosDevice) {
					mosDevice.routeData(parsed).then((message: MosMessage) => {
						sendReply(message)
					}).catch((err: Error | MosMessage) => {
						// Something went wrong
						if (err instanceof MosMessage) {
							sendReply(err)
						} else {
							// Unknown / internal error
							// Log error:
							console.log(err)
							// reply with NACK:
							// TODO: implement ACK
							// http://mosprotocol.com/wp-content/MOS-Protocol-Documents/MOS_Protocol_Version_2.8.5_Final.htm#mosAck
						}
						// console.log(err)
					})
				} else {
					// TODO: Handle missing mosDevice
					// should reply with a NACK
				}
			}
		})
		e.socket.on('error', (error: Error) => {
			if (this._debug) console.log(`Socket had error (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${error}`)
		})

		// registers socket on server
		// e.socket.remoteAddress är ej OK id, måste bytas ut
		let server: Server = this._getServerForHost(e.socket.remoteAddress)
		server.registerIncomingConnection(socketID, e.socket, e.portDescription)
		if (this._debug) console.log('added: ', this._servers)
	}

	/** */
	private _disposeIncomingSocket (socket: Socket, socketID: number) {
		socket.removeAllListeners()
		socket.destroy()
		// e.socket.remoteAddress är ej OK id, måste bytas ut
		this._getServerForHost(socket.remoteAddress).removeSocket(socketID)
		if (this._debug) console.log('removed: ', this._servers, '\n')
	}

	/** */
	private _getServerForHost (host: string): Server {
		// create new server if not known
		if (!this._servers[host]) {
			if (this._debug) console.log('Creating new Server')
			this._servers[host] = new Server()
		}

		return this._servers[host]
	}

	private static get nextSocketID (): number {
		return this._nextSocketID++
	}
}
