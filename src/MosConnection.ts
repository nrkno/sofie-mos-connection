import { Socket } from 'net'
import { ConnectionConfig, IConnectionConfig, IProfiles } from './config/connectionConfig'
import { MosSocketServer } from './connection/mosSocketServer'
import {
	IMosConnection,
	IMOSDeviceConnectionOptions,
	IMOSDevice,
	IMOSAckStatus
} from './api'
import { MosDevice } from './MosDevice'
import { SocketServerEvent, SocketDescription } from './connection/socketConnection'
import { NCSServerConnection } from './connection/NCSServerConnection'
import * as parser from 'xml2json'
import { MosMessage } from './mosModel/MosMessage'
import { MOSAck } from './mosModel/mosAck'
import { MosString128 } from './dataTypes/mosString128'
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
	private _incomingSockets: {[sockedId: string]: SocketDescription} = {}
	private _ncsConnections: {[host: string]: NCSServerConnection} = {}
	private _mosDevices: {[ncsID: string]: MosDevice} = {}

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
	connect (connectionOptions: IMOSDeviceConnectionOptions): Promise<MosDevice> {
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
			let mosDevice = this.registerMosDevice(
				this._conf.mosID,
				connectionOptions.primary.id,
				(connectionOptions.secondary ? connectionOptions.secondary.id : null),
				primary, secondary)
			resolve(mosDevice)
		})
	}
	onConnection (cb: (mosDevice: IMOSDevice) => void) {
		this._onconnection = cb
	}
	registerMosDevice (
		myMosID: string,
		theirMosId0: string,
		theirMosId1: string | null,
		primary: NCSServerConnection | null, secondary: NCSServerConnection | null): MosDevice {
		let id0 = myMosID + '_' + theirMosId0
		let id1 = (theirMosId1 ? myMosID + '_' + theirMosId1 : null)
		let mosDevice = new MosDevice(id0, id1, this._conf, primary, secondary)
		this._mosDevices[id0] = mosDevice
		if (id1) this._mosDevices[id1] = mosDevice
		mosDevice.connect()

		// emit to .onConnection
		if (this._onconnection) this._onconnection(mosDevice)
		return mosDevice
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
		let sockets: Array<Socket> = []
		for (let socketID in this._incomingSockets) {
			let e = this._incomingSockets[socketID]
			if (e) {
				sockets.push(e.socket)
			}
		}
		let disposePromises: Array<Promise<void>> = sockets.map((socket) => {
			return new Promise((resolve) => {
				socket.on('close', resolve)
				socket.end()
				socket.destroy()
			})
		})
		disposePromises.push(this._lowerSocketServer.dispose([]))
		disposePromises.push(this._upperSocketServer.dispose([]))
		disposePromises.push(this._querySocketServer.dispose([]))
		return new Promise((resolveDispose) => {
			Promise.all(disposePromises)
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

		// console.log('_registerIncomingClient', socketID, e.socket.remoteAddress)

		// handles socket listeners
		e.socket.on('close', (/*hadError: boolean*/) => {
			this._disposeIncomingSocket(socketID)
		}) // => this._disposeIncomingSocket(e.socket, socketID))
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

			// console.log(str)
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
				let mosDevice = (
					this._mosDevices[parsed.mos.ncsID + '_' + parsed.mos.mosID] ||
					this._mosDevices[parsed.mos.mosID + '_' + parsed.mos.ncsID]
				)

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
				if (!mosDevice && this._conf.openRelay) {
					// console.log('OPEN RELAY ------------------')
					// Register a new mosDevice to use for this connection
					if (parsed.mos.ncsID === this._conf.mosID) {
						mosDevice = this.registerMosDevice(
							this._conf.mosID,
							parsed.mos.mosID,
							null,null, null)
					} else if (parsed.mos.mosID === this._conf.mosID) {
						mosDevice = this.registerMosDevice(
							this._conf.mosID,
							parsed.mos.ncsID,
							null, null, null)
					}
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
							let msg = new MOSAck()
							msg.ID = new MosString128(0)
							msg.Revision = 0
							msg.Description = new MosString128('Internal Error')
							msg.Status = IMOSAckStatus.NACK
							sendReply(msg) // TODO: Need tests
						}
						// console.log(err)
					})
				} else {
					// TODO: Handle missing mosDevice
					// should reply with a NACK
					let msg = new MOSAck()
					msg.ID = new MosString128(0)
					msg.Revision = 0
					msg.Description = new MosString128('MosDevice not found')
					msg.Status = IMOSAckStatus.NACK
					sendReply(msg) // TODO: Need tests
				}
			}
		})
		e.socket.on('error', (error: Error) => {
			if (this._debug) console.log(`Socket had error (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${error}`)
		})

		// registers socket on server
		// e.socket.remoteAddress är ej OK id, måste bytas ut
		// let server: Server = this._getServerForHost(e.socket.remoteAddress)
		// server.registerIncomingConnection(socketID, e.socket, e.portDescription)
		this._incomingSockets[socketID + ''] = e
		if (this._debug) console.log('added: ', socketID)
	}

	/** */
	private _disposeIncomingSocket (socketID: number) {
		let e = this._incomingSockets[socketID + '']
		if (e) {
			e.socket.removeAllListeners()
			e.socket.destroy()
		}
		delete this._incomingSockets[socketID + '']
		// e.socket.remoteAddress är ej OK id, måste bytas ut
		// this._getServerForHost(socket.remoteAddress).removeSocket(socketID)
		if (this._debug) console.log('removed: ', socketID, '\n')
	}

	private static get nextSocketID (): number {
		return this._nextSocketID++
	}
}
