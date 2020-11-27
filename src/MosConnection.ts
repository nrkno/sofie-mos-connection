import { Socket } from 'net'
import { ConnectionConfig, IConnectionConfig, IProfiles } from './config/connectionConfig'
import { MosSocketServer } from './connection/mosSocketServer'
import {
	IMosConnection,
	IMOSDeviceConnectionOptions,
	IMOSAckStatus
} from './api'
import { MosDevice } from './MosDevice'
import { SocketServerEvent, SocketDescription, IncomingConnectionType } from './connection/socketConnection'
import { NCSServerConnection } from './connection/NCSServerConnection'
import { xml2js } from './utils/Utils'
import { MosMessage } from './mosModel/MosMessage'
import { MOSAck } from './mosModel'
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

	private _lowerSocketServer?: MosSocketServer
	private _upperSocketServer?: MosSocketServer
	private _querySocketServer?: MosSocketServer
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
	/**
	 * Initiate the MosConnection, start accepting connections
	 */
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

	/**
	 * Establish a new connection to a MOS-device (NCS-server). When established, the new MOS-device will be emitted to this.onConnection()
	 * @param connectionOptions Connection options
	 */
	connect (connectionOptions: IMOSDeviceConnectionOptions): Promise<MosDevice> {
		if (!this._initialized) throw Error('Not initialized, run .init() first!')

		return new Promise((resolve) => {

			// Connect to MOS-device:
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
			primary.on('warning', (str: string) => {
				this.emit('warning', 'primary: ' + str)
			})
			primary.on('error', (str: string) => {
				this.emit('error', 'primary: ' + str)
			})

			primary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_LOWER, 'lower', true)
			primary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_UPPER, 'upper', true)
			if (!connectionOptions.primary.dontUseQueryPort) primary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_QUERY, 'query', false)

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
				secondary.on('warning', (str: string) => {
					this.emit('warning', 'secondary: ' + str)
				})
				secondary.on('error', (str: string) => {
					this.emit('error', 'secondary: ' + str)
				})
				secondary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_LOWER, 'lower', true)
				secondary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_UPPER, 'upper', true)
				if (!connectionOptions.primary.dontUseQueryPort) secondary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_QUERY, 'query', false)
			}

			// Initialize mosDevice:
			let mosDevice = this._registerMosDevice(
				this._conf.mosID,
				connectionOptions.primary.id,
				(connectionOptions.secondary ? connectionOptions.secondary.id : null),
				primary, secondary)

			resolve(mosDevice)
		})
	}
	/** Callback is called when a new connection is established */
	onConnection (cb: (mosDevice: MosDevice) => void) {
		this._onconnection = cb
	}
	/** True if mosConnection is listening for connections */
	get isListening (): boolean {
		return this._isListening
	}

	/** TO BE IMPLEMENTED: True if mosConnection is mos-compliant */
	get isCompliant (): boolean {
		return false
	}

	/** True if mosConnection is configured to accept connections */
	get acceptsConnections (): boolean {
		return this._conf.acceptsConnections
	}

	/** A list of the profiles mosConnection is currently configured to use */
	get profiles (): IProfiles {
		return this._conf.profiles
	}

	/** Close all connections and clear all data */
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
			this._lowerSocketServer ? this._lowerSocketServer.dispose([]) : Promise.resolve(),
			this._upperSocketServer ? this._upperSocketServer.dispose([]) : Promise.resolve(),
			this._querySocketServer ? this._querySocketServer.dispose([]) : Promise.resolve()
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
	/** Return a specific MOS-device */
	getDevice (id: string): MosDevice {
		return this._mosDevices[id]
	}
	/** Get a list of all MOS-devices */
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

	/** TO BE IMPLEMENTED */
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
	public setDebug (debug: boolean): void {
		this._debug = debug

		this.getDevices().forEach((device: MosDevice) => {
			device.setDebug(debug)
		})
		Object.keys(this._ncsConnections).forEach((host) => {
			let conn = this._ncsConnections[host]
			if (conn) {
				conn.setDebug(debug)
			}
		})
		if (this._lowerSocketServer) this._lowerSocketServer.setDebug(debug)
		if (this._upperSocketServer) this._upperSocketServer.setDebug(debug)
		if (this._querySocketServer) this._querySocketServer.setDebug(debug)
	}
	private _registerMosDevice (
		myMosID: string,
		theirMosId0: string,
		theirMosId1: string | null,
		primary: NCSServerConnection | null, secondary: NCSServerConnection | null
	): MosDevice {
		let id0 = myMosID + '_' + theirMosId0
		let id1 = (theirMosId1 ? myMosID + '_' + theirMosId1 : null)
		let mosDevice = new MosDevice(id0, id1, this._conf, primary, secondary, this._conf.offspecFailover, this._conf.strict)
		mosDevice.setDebug(this._debug)
		// Add mosDevice to register:
		if (this._mosDevices[id0]) {
			throw new Error('Unable to register MosDevice "' + id0 + '": The device already exists!')
		}
		if (id1 && this._mosDevices[id1]) {
			throw new Error('Unable to register MosDevice "' + id1 + '": The device already exists!')
		}
		this._mosDevices[id0] = mosDevice
		if (id1) this._mosDevices[id1] = mosDevice
		mosDevice.connect()

		// emit to .onConnection:
		if (this._onconnection) this._onconnection(mosDevice)
		return mosDevice
	}

	/** Set up TCP-server */
	private _initiateIncomingConnections (): Promise<void> {
		if (!this._conf.acceptsConnections) {
			return Promise.reject('Not configured for accepting connections')
		}

		let initSocket = (port: number, portType: IncomingConnectionType) => {
			let socketServer = new MosSocketServer(port, portType)
			socketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))
			socketServer.on(SocketServerEvent.ERROR, (e) => {
				// handle error
				this.emit('error', e)
			})

			return socketServer
		}

		this._lowerSocketServer = initSocket(MosConnection.CONNECTION_PORT_LOWER, 'lower')
		this._upperSocketServer = initSocket(MosConnection.CONNECTION_PORT_UPPER, 'upper')
		this._querySocketServer = initSocket(MosConnection.CONNECTION_PORT_QUERY, 'query')

		let handleListen = (socketServer: MosSocketServer) => {
			return socketServer.listen()
			.then(() => {
				this.emit('info', 'Listening on port ' + socketServer.port + ' (' + socketServer.portDescription + ')')
			})
		}
		return Promise.all(
			[
				handleListen(this._lowerSocketServer),
				handleListen(this._upperSocketServer),
				handleListen(this._querySocketServer)
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

		// handles socket listeners
		client.socket.on('close', (/*hadError: boolean*/) => {
			this._disposeIncomingSocket(socketID)
			this.emit('rawMessage', 'incoming_' + socketID, 'closedConnection', '')
		})
		client.socket.on('end', () => {
			if (this._debug) console.log('Socket End')
		})
		client.socket.on('drain', () => {
			if (this._debug) console.log('Socket Drain')
		})
		client.socket.on('data', async (data: Buffer) => {
			const messageString = iconv.decode(data, 'utf16-be').trim()

			this.emit('rawMessage', 'incoming', 'recieved', messageString)

			if (this._debug) console.log(`Socket got data (${socketID}, ${client.socket.remoteAddress}, ${client.portDescription}): ${data}`)
			const remoteAddressContent = client.socket.remoteAddress
				? client.socket.remoteAddress.split(':')
				: undefined
			const remoteAddress = remoteAddressContent ? remoteAddressContent[remoteAddressContent.length - 1] : ''

			// Figure out if the message buffer contains a complete MOS-message:
			let parsed: any = null
			const firstMatch = '<mos>'
			const first = messageString.substr(0, firstMatch.length)
			const lastMatch = '</mos>'
			const last = messageString.substr(-lastMatch.length)

			if (!client.chunks) client.chunks = ''
			try {
				if (first === firstMatch && last === lastMatch) {
					// Data is ready to be parsed:
					parsed = xml2js(messageString)
				} else if (last === lastMatch) {
					// Last chunk, ready to parse with saved data:
					parsed = xml2js(client.chunks + messageString)
					client.chunks = ''
				} else if (first === firstMatch) {
					// First chunk, save for later:
					client.chunks = messageString
				} else {
					// Chunk, save for later:
					client.chunks += messageString
				}
				if (parsed !== null) {
					const ncsID = parsed.mos.ncsID
					const mosID = parsed.mos.mosID
					const mosMessageId: number = parsed.mos.messageID

					let mosDevice = this._mosDevices[ncsID + '_' + mosID] || this._mosDevices[mosID + '_' + ncsID]

					let sendReply = (message: MosMessage) => {
						message.ncsID = ncsID
						message.mosID = mosID
						message.prepare(mosMessageId)
						const messageString: string = message.toString()
						const buf = iconv.encode(messageString, 'utf16-be')
						client.socket.write(buf, 'usc2')

						this.emit('rawMessage', 'incoming_' + socketID, 'sent', messageString)
					}
					if (!mosDevice && this._conf.openRelay) {
						// No MOS-device found in the register
						// Register a new mosDevice to use for this connection:
						if (ncsID === this._conf.mosID) {
							// Setup a "primary" connection back to the mos-device, so that we can automatically
							// send commands to it through the mosDevice

							let primary = new NCSServerConnection(
								mosID,
								remoteAddress,
								this._conf.mosID,
								undefined,
								this._debug
							)
							this._ncsConnections[remoteAddress] = primary

							primary.on('rawMessage', (type: string, message: string) => {
								this.emit('rawMessage', 'primary', type, message)
							})
							primary.on('warning', (str: string) => {
								this.emit('warning', 'primary: ' + str)
							})
							primary.on('error', (str: string) => {
								this.emit('error', 'primary: ' + str)
							})

							primary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_LOWER, 'lower', true)
							primary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_UPPER, 'upper', true)

							mosDevice = this._registerMosDevice(this._conf.mosID, mosID, null, primary, null)
						} else if (mosID === this._conf.mosID) {
							mosDevice = await this.connect({
								primary: {
									id: ncsID,
									host: remoteAddress
								}
							})
						}
					}
					if (mosDevice) {

						mosDevice.routeData(parsed, client.portDescription).then((message: MosMessage) => {
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
						// No MOS-device found in the register

						// We can't handle the message, reply with a NACK:
						let msg = new MOSAck()
						msg.ID = new MosString128(0)
						msg.Revision = 0
						msg.Description = new MosString128(`MosDevice "${ncsID + '_' + mosID}" not found`)
						msg.Status = IMOSAckStatus.NACK
						sendReply(msg) // TODO: Need tests
					}
				}
			} catch (e) {
				if (this._debug) {
					console.log('chunks-------------\n', client.chunks)
					console.log('messageString---------\n', messageString)
					console.log('error', e)
				}
				this.emit('error', e)
			}
		})
		client.socket.on('error', (e: Error) => {
			if (this._debug) console.log(`Socket had error (${socketID}, ${client.socket.remoteAddress}, ${client.portDescription}): ${e}`)
		})

		// Register this socket:
		this._incomingSockets[socketID + ''] = client
		if (this._debug) console.log('Added socket: ', socketID)
	}
	/** Close socket and clean up */
	private _disposeIncomingSocket (socketID: string) {
		let e = this._incomingSockets[socketID + '']
		if (e) {
			e.socket.removeAllListeners()
			e.socket.destroy()
		}
		delete this._incomingSockets[socketID + '']
		if (this._debug) console.log('removed: ', socketID, '\n')
	}
	/** Get new unique id */
	static get nextSocketID (): string {
		return this._nextSocketID++ + ''
	}
}
