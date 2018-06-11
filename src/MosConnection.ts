import { Socket } from 'net'
import { ConnectionConfig, IConnectionConfig, IProfiles } from './config/connectionConfig'
import { MosSocketServer } from './connection/mosSocketServer'
import {
	IMosConnection,
	IMOSDeviceConnectionOptions,
	IMOSAckStatus
} from './api'
import { MosDevice } from './MosDevice'
import { SocketServerEvent, SocketDescription } from './connection/socketConnection'
import { NCSServerConnection } from './connection/NCSServerConnection'
import * as parser from 'xml2json'
import { MosMessage } from './mosModel/MosMessage'
import { MOSAck } from './mosModel/mosAck'
import { MosString128 } from './dataTypes/mosString128'
import { EventEmitter } from 'events'
const iconv = require('iconv-lite')

export class MosConnection extends EventEmitter implements IMosConnection {
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
	private _initialized: boolean = false
	private _isListening: boolean = false

	// private _isListening: Promise<boolean[]>

	private _onconnection: (mosDevice: MosDevice) => void

	/** */
	constructor (configOptions: IConnectionConfig) {
		super()
		this._conf = new ConnectionConfig(configOptions)

		if (this._conf.debug) {
			this._debug = this._conf.debug
		}
	}
	init (): Promise<boolean> {
		this._initialized = true
		if (this._conf.acceptsConnections) {
			return new Promise((resolve, reject) => {
				this._initiateIncomingConnections()
				.then(() => {
					this._isListening = true
					resolve(true)
				})
				.catch((err) => {
					// this.emit('error', err)
					reject(err)
				})
			})
		}
		return Promise.resolve(false)
	}

	/** */
	connect (connectionOptions: IMOSDeviceConnectionOptions): Promise<MosDevice> {
		if (!this._initialized) throw Error('Not initialized, run .init() first!')

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

			primary.on('rawMessage', (type: string, message: string) => {
				this.emit('rawMessage', 'primary', type, message)
			})

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
				secondary.on('rawMessage', (type: string, message: string) => {
					this.emit('rawMessage', 'secondary', type, message)
				})
				secondary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_LOWER, 'lower')
				secondary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_UPPER, 'upper')
			}

			// initialize mosDevice:
			let mosDevice = this._registerMosDevice(
				this._conf.mosID,
				connectionOptions.primary.id,
				(connectionOptions.secondary ? connectionOptions.secondary.id : null),
				primary, secondary)

			resolve(mosDevice)
		})
	}
	onConnection (cb: (mosDevice: MosDevice) => void) {
		this._onconnection = cb
	}
	/** */
	get isListening (): boolean {
		return this._isListening
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
		let disposePromises0: Array<Promise<any>> = sockets.map((socket: Socket) => {
			return new Promise((resolve) => {
				socket.on('close', resolve)
				socket.end()
				socket.destroy()
			})
		})
		let disposePromises1: Array<Promise<any>> = [
			this._lowerSocketServer.dispose([]),
			this._upperSocketServer.dispose([]),
			this._querySocketServer.dispose([])
		]

		let disposePromises2: Array<Promise<any>> = []
		Object.keys(this._mosDevices).map(deviceId => {
			let device = this._mosDevices[deviceId]
			disposePromises2.push(
				this.disposeMosDevice(device)
			)
		})
		return Promise.all(disposePromises0)
		.then(() => {
			return Promise.all(disposePromises1)
		})
		.then(() => {
			return Promise.all(disposePromises2)
		})
		.then(() => {
			return
		})
	}
	getDevice (id: string): MosDevice {
		return this._mosDevices[id]
	}
	getDevices (): Array<MosDevice> {
		return Object.keys(this._mosDevices).map((id: string) => {
			return this._mosDevices[id]
		})
	}
	disposeMosDevice (mosDevice: MosDevice): Promise<void>
	disposeMosDevice (myMosID: string, theirMosId0: string, theirMosId1: string | null): Promise<void>
	disposeMosDevice (
		myMosIDOrMosDevice: string | MosDevice,
		theirMosId0?: string,
		theirMosId1?: string | null
	): Promise<void> {
		let id0: string
		let id1: string | null
		if (myMosIDOrMosDevice && myMosIDOrMosDevice instanceof MosDevice) {
			// myMosID = myMosIDOrMosDevice
			let mosDevice = myMosIDOrMosDevice
			id0 = mosDevice.idPrimary
			id1 = mosDevice.idSecondary
		} else {
			let myMosID = myMosIDOrMosDevice
			id0 = myMosID + '_' + theirMosId0
			id1 = (theirMosId1 ? myMosID + '_' + theirMosId1 : null)
		}
		if (this._mosDevices[id0]) {
			return this._mosDevices[id0].dispose()
			.then(() => {
				delete this._mosDevices[id0]
			})
		} else if (id1 && this._mosDevices[id1]) {
			return this._mosDevices[id1].dispose()
			.then(() => {
				delete this._mosDevices[id1 || '']
			})
		} else {
			return Promise.reject('Device not found')
		}
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
	private _registerMosDevice (
		myMosID: string,
		theirMosId0: string,
		theirMosId1: string | null,
		primary: NCSServerConnection | null, secondary: NCSServerConnection | null
	): MosDevice {
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
	private _initiateIncomingConnections (): Promise<void> {
		// console.log('_initiateIncomingConnections')
		// shouldn't accept connections, so won't rig socket servers
		if (!this._conf.acceptsConnections) {
			return Promise.reject('Not configured for accepting connections')
			// console.log('reject')
		}

		// setup two socket servers, then resolve with their listening statuses
		this._lowerSocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_LOWER, 'lower')
		this._upperSocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_UPPER, 'upper')
		this._querySocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_QUERY, 'query')

		this._lowerSocketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))
		this._upperSocketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))
		this._querySocketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))

		// console.log('listen on all ports')
		return Promise.all(
			[
				this._lowerSocketServer.listen(),
				this._upperSocketServer.listen(),
				this._querySocketServer.listen()
			]
		).then(() => {
			// All sockets are open and listening at this point
			return
		})
	}

	/** */
	private _registerIncomingClient (client: SocketDescription) {
		let socketID = MosConnection.nextSocketID

		this.emit('rawMessage', 'incoming_' + socketID, 'newConnection', 'From ' + client.socket.remoteAddress + ':' + client.socket.remotePort)
		// console.log('_registerIncomingClient', socketID, e.socket.remoteAddress)

		// handles socket listeners
		client.socket.on('close', (/*hadError: boolean*/) => {
			this._disposeIncomingSocket(socketID)
			this.emit('rawMessage', 'incoming_' + socketID, 'closedConnection', '')
		}) // => this._disposeIncomingSocket(e.socket, socketID))
		client.socket.on('end', () => {
			if (this._debug) console.log('Socket End')
		})
		client.socket.on('drain', () => {
			if (this._debug) console.log('Socket Drain')
		})
		client.socket.on('data', (data: Buffer) => {
			let messageString = iconv.decode(data, 'utf16-be').trim()

			this.emit('rawMessage', 'incoming', 'recieved', messageString)

			if (this._debug) console.log(`Socket got data (${socketID}, ${client.socket.remoteAddress}, ${client.portDescription}): ${data}`)

			let parsed: any = null
			let parseOptions: any = {
				object: true,
				coerce: true,
				trim: true
			}
			let firstMatch = '<mos>' // <mos>
			let first = messageString.substr(0, firstMatch.length)
			let lastMatch = '</mos>' // </mos>
			let last = messageString.substr(-lastMatch.length)

			if (!client.chunks) client.chunks = ''
			try {

				// console.log('--------------------------------------------------------')
				// console.log(messageString)
				if (first === firstMatch && last === lastMatch) {
					// Data ready to be parsed:
					parsed = parser.toJson(messageString, parseOptions)
				} else if (last === lastMatch) {
					// Last chunk, ready to parse with saved data:
					parsed = parser.toJson(client.chunks + messageString, parseOptions)
					client.chunks = ''
				} else if (first === firstMatch) {
					// Chunk, save for later:
					client.chunks = messageString
				} else {
					// Chunk, save for later:
					client.chunks += messageString
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
						let messageString: string = message.toString()
						let buf = iconv.encode(messageString, 'utf16-be')
						client.socket.write(buf, 'usc2')

						this.emit('rawMessage', 'incoming_' + socketID, 'sent', messageString)
					}
					if (!mosDevice && this._conf.openRelay) {
						// console.log('OPEN RELAY ------------------')
						// Register a new mosDevice to use for this connection
						if (parsed.mos.ncsID === this._conf.mosID) {
							mosDevice = this._registerMosDevice(
								this._conf.mosID,
								parsed.mos.mosID,
								null,null, null)
						} else if (parsed.mos.mosID === this._conf.mosID) {
							mosDevice = this._registerMosDevice(
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
			} catch (e) {
				console.log('chunks-------------\n', client.chunks)
				console.log('messageString---------\n', messageString)
				console.log('error', e)
				this.emit('error', e)
			}
		})
		client.socket.on('error', (e: Error) => {
			if (this._debug) console.log(`Socket had error (${socketID}, ${client.socket.remoteAddress}, ${client.portDescription}): ${e}`)
		})

		// registers socket on server
		// e.socket.remoteAddress är ej OK id, måste bytas ut
		// let server: Server = this._getServerForHost(e.socket.remoteAddress)
		// server.registerIncomingConnection(socketID, e.socket, e.portDescription)
		this._incomingSockets[socketID + ''] = client
		if (this._debug) console.log('added: ', socketID)
	}

	/** */
	private _disposeIncomingSocket (socketID: string) {
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

	private static get nextSocketID (): string {
		return this._nextSocketID++ + ''
	}
}
