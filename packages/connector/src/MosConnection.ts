import { Socket } from 'net'
import { ConnectionConfig } from './config/connectionConfig'
import { MosSocketServer } from './connection/mosSocketServer'
import { getMosTypes, IMOSAckStatus, IProfiles, MosTypes } from '@mos-connection/model'
import { MosDevice } from './MosDevice'
import { SocketServerEvent, SocketDescription, IncomingConnectionType } from './connection/socketConnection'
import { NCSServerConnection } from './connection/NCSServerConnection'
import { MosModel } from '@mos-connection/helper'
import { EventEmitter } from 'events'
import * as iconv from 'iconv-lite'
import { MosMessageParser } from './connection/mosMessageParser'
import { IConnectionConfig, IMosConnection, IMOSDeviceConnectionOptions } from './api'
import { PROFILE_VALIDNESS_CHECK_WAIT_TIME } from './lib'

export class MosConnection extends EventEmitter implements IMosConnection {
	static CONNECTION_PORT_LOWER = 10540
	static CONNECTION_PORT_UPPER = 10541
	static CONNECTION_PORT_QUERY = 10542
	static _nextSocketID = 0

	public readonly mosTypes: MosTypes

	private _conf: ConnectionConfig
	private _debug = false
	private _disposed = false
	private _scheduleCheckProfileValidnessTimeout: NodeJS.Timeout | null = null

	private _lowerSocketServer?: MosSocketServer
	private _upperSocketServer?: MosSocketServer
	private _querySocketServer?: MosSocketServer
	private _incomingSockets: { [sockedId: string]: SocketDescription } = {}
	private _ncsConnections: { [host: string]: NCSServerConnection } = {}
	private _mosDevices: { [ncsID: string]: MosDevice } = {}
	private _initialized = false
	private _isListening = false

	// private _isListening: Promise<boolean[]>

	private _onConnection?: (mosDevice: MosDevice) => void

	/** */
	constructor(configOptions: IConnectionConfig) {
		super()
		this._conf = new ConnectionConfig(configOptions)

		if (this._conf.debug) {
			this._debug = this._conf.debug
		}
		// Setup utility functions for handling MosTypes:
		this.mosTypes = getMosTypes(configOptions.strict ?? false)

		if (this._conf.strict) {
			const orgStack = new Error()
			this._scheduleCheckProfileValidness(orgStack)
		}
	}
	/**
	 * Initiate the MosConnection, start accepting connections
	 */
	async init(): Promise<boolean> {
		this.emit('info', `Initializing MOS-Connection, id: ${this._conf.mosID}`)
		this._initialized = true
		if (this._conf.acceptsConnections) {
			await this._initiateIncomingConnections()
			this._isListening = true
			return true
		}
		return false
	}

	/**
	 * Establish a new connection to a MOS-device (NCS-server). When established, the new MOS-device will be emitted to this.onConnection()
	 * @param connectionOptions Connection options
	 */
	async connect(connectionOptions: IMOSDeviceConnectionOptions): Promise<MosDevice> {
		if (!this._initialized) throw Error('Not initialized, run .init() first!')

		// Connect to MOS-device:
		const primary = new NCSServerConnection(
			connectionOptions.primary.id,
			connectionOptions.primary.host,
			this._conf.mosID,
			connectionOptions.primary.timeout,
			connectionOptions.primary.heartbeatInterval,
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
		primary.on('info', (str: string) => {
			this.emit('info', 'primary: ' + str)
		})

		primary.createClient(
			MosConnection.nextSocketID,
			connectionOptions.primary.ports?.lower ?? MosConnection.CONNECTION_PORT_LOWER,
			'lower',
			true
		)
		primary.createClient(
			MosConnection.nextSocketID,
			connectionOptions.primary.ports?.upper ?? MosConnection.CONNECTION_PORT_UPPER,
			'upper',
			true
		)
		if (!connectionOptions.primary.dontUseQueryPort) {
			primary.createClient(
				MosConnection.nextSocketID,
				connectionOptions.primary.ports?.query ?? MosConnection.CONNECTION_PORT_QUERY,
				'query',
				false
			)
		}

		if (connectionOptions.secondary) {
			secondary = new NCSServerConnection(
				connectionOptions.secondary.id,
				connectionOptions.secondary.host,
				this._conf.mosID,
				connectionOptions.secondary.timeout,
				connectionOptions.secondary.heartbeatInterval,
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
			secondary.on('info', (str: string) => {
				this.emit('info', 'secondary: ' + str)
			})
			secondary.createClient(
				MosConnection.nextSocketID,
				connectionOptions.secondary.ports?.lower ?? MosConnection.CONNECTION_PORT_LOWER,
				'lower',
				true
			)
			secondary.createClient(
				MosConnection.nextSocketID,
				connectionOptions.secondary.ports?.upper ?? MosConnection.CONNECTION_PORT_UPPER,
				'upper',
				true
			)
			if (!connectionOptions.primary.dontUseQueryPort) {
				secondary.createClient(
					MosConnection.nextSocketID,
					connectionOptions.secondary.ports?.query ?? MosConnection.CONNECTION_PORT_QUERY,
					'query',
					false
				)
			}
		}

		return this._registerMosDevice(
			this._conf.mosID,
			connectionOptions.primary.id,
			connectionOptions.secondary ? connectionOptions.secondary.id : null,
			primary,
			secondary
		)
	}
	/** Callback is called when a new connection is established */
	onConnection(cb: (mosDevice: MosDevice) => void): void {
		this._onConnection = cb
	}
	/** True if mosConnection is listening for connections */
	get isListening(): boolean {
		return this._isListening
	}

	/** TO BE IMPLEMENTED: True if mosConnection is mos-compliant */
	get isCompliant(): boolean {
		return false
	}

	/** True if mosConnection is configured to accept connections */
	get acceptsConnections(): boolean {
		return this._conf.acceptsConnections
	}

	/** A list of the profiles mosConnection is currently configured to use */
	get profiles(): IProfiles {
		return this._conf.profiles
	}

	/** Close all connections and clear all data */
	async dispose(): Promise<void> {
		this._disposed = true
		const sockets: Array<Socket> = []
		for (const socketID in this._incomingSockets) {
			const e = this._incomingSockets[socketID]
			if (e) {
				sockets.push(e.socket)
			}
		}
		const disposePromises0: Array<Promise<any>> = sockets.map(async (socket: Socket) => {
			return new Promise((resolve) => {
				socket.on('close', resolve)
				socket.end()
				socket.destroy()
			})
		})
		const disposePromises1: Array<Promise<any>> = [
			this._lowerSocketServer ? this._lowerSocketServer.dispose([]) : Promise.resolve(),
			this._upperSocketServer ? this._upperSocketServer.dispose([]) : Promise.resolve(),
			this._querySocketServer ? this._querySocketServer.dispose([]) : Promise.resolve(),
		]

		const disposePromises2: Array<Promise<any>> = []
		for (const deviceId of Object.keys(this._mosDevices)) {
			const device = this._mosDevices[deviceId]
			disposePromises2.push(this.disposeMosDevice(device))
		}
		await Promise.all(disposePromises0)
		await Promise.all(disposePromises1)
		await Promise.all(disposePromises2)
	}
	/** Return a specific MOS-device */
	getDevice(id: string): MosDevice {
		return this._mosDevices[id]
	}
	/** Get a list of all MOS-devices */
	getDevices(): Array<MosDevice> {
		return Object.keys(this._mosDevices).map((id: string) => {
			return this._mosDevices[id]
		})
	}
	disposeMosDevice(mosDevice: MosDevice): Promise<void>
	disposeMosDevice(myMosID: string, theirMosId0: string, theirMosId1: string | null): Promise<void>
	async disposeMosDevice(
		myMosIDOrMosDevice: string | MosDevice,
		theirMosId0?: string,
		theirMosId1?: string | null
	): Promise<void> {
		let id0: string
		let id1: string | null
		if (myMosIDOrMosDevice && myMosIDOrMosDevice instanceof MosDevice) {
			// myMosID = myMosIDOrMosDevice
			const mosDevice = myMosIDOrMosDevice
			id0 = mosDevice.idPrimary
			id1 = mosDevice.idSecondary
		} else {
			const myMosID = myMosIDOrMosDevice
			id0 = myMosID + '_' + theirMosId0
			id1 = theirMosId1 ? myMosID + '_' + theirMosId1 : null
		}
		if (this._mosDevices[id0]) {
			await this._mosDevices[id0].dispose()
			delete this._mosDevices[id0]
		} else if (id1 && this._mosDevices[id1]) {
			await this._mosDevices[id1].dispose()
			delete this._mosDevices[id1]
		} else {
			throw new Error(`Device not found ("${id0}", "${id1}")`)
		}
	}

	/**
	 * Do a check if the profile is valid. Throws if not.
	 * Optionally called after a mosConnection has been set up to ensure that all callbacks have been set up properly.
	 */
	checkProfileValidness(): void {
		if (this._scheduleCheckProfileValidnessTimeout) {
			clearTimeout(this._scheduleCheckProfileValidnessTimeout)
			this._scheduleCheckProfileValidnessTimeout = null
		}
		const orgStack = new Error()
		this._checkProfileValidness(orgStack)
	}

	/** TO BE IMPLEMENTED */
	get complianceText(): string {
		if (this.isCompliant) {
			const profiles: string[] = []
			for (const nextSocketID in this._conf.profiles) {
				if (this._conf.profiles[nextSocketID] === true) {
					profiles.push(nextSocketID)
				}
			}
			return `MOS Compatible - Profiles ${profiles.join(',')}`
		}
		return 'Warning: Not MOS compatible'
	}
	public setDebug(debug: boolean): void {
		this._debug = debug

		this.getDevices().forEach((device: MosDevice) => {
			device.setDebug(debug)
		})
		Object.keys(this._ncsConnections).forEach((host) => {
			const conn = this._ncsConnections[host]
			if (conn) {
				conn.setDebug(debug)
			}
		})
		if (this._lowerSocketServer) this._lowerSocketServer.setDebug(debug)
		if (this._upperSocketServer) this._upperSocketServer.setDebug(debug)
		if (this._querySocketServer) this._querySocketServer.setDebug(debug)
	}
	private _registerMosDevice(
		myMosID: string,
		theirMosId0: string,
		theirMosId1: string | null,
		primary: NCSServerConnection | null,
		secondary: NCSServerConnection | null
	): MosDevice {
		const id0 = myMosID + '_' + theirMosId0
		const id1 = theirMosId1 ? myMosID + '_' + theirMosId1 : null
		const mosDevice = new MosDevice(
			id0,
			id1,
			this._conf,
			primary,
			secondary,
			this._conf.offspecFailover,
			this.mosTypes.strict
		)
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
		if (this._onConnection) this._onConnection(mosDevice)
		return mosDevice
	}

	/** Set up TCP-server */
	private async _initiateIncomingConnections(): Promise<void> {
		if (!this._conf.acceptsConnections) {
			return Promise.reject(new Error('Not configured for accepting connections'))
		}

		const initSocket = (port: number, portType: IncomingConnectionType) => {
			const socketServer = new MosSocketServer(port, portType, this._debug)
			socketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) =>
				this._registerIncomingClient(e)
			)
			socketServer.on(SocketServerEvent.ERROR, (e) => {
				// handle error
				this.emit('error', e)
			})

			return socketServer
		}

		this._lowerSocketServer = initSocket(this._conf.ports?.lower ?? MosConnection.CONNECTION_PORT_LOWER, 'lower')
		this._upperSocketServer = initSocket(this._conf.ports?.upper ?? MosConnection.CONNECTION_PORT_UPPER, 'upper')
		this._querySocketServer = initSocket(this._conf.ports?.query ?? MosConnection.CONNECTION_PORT_QUERY, 'query')

		const handleListen = async (socketServer: MosSocketServer) => {
			await socketServer.listen()
			this.emit('info', 'Listening on port ' + socketServer.port + ' (' + socketServer.portDescription + ')')
		}
		await Promise.all([
			handleListen(this._lowerSocketServer),
			handleListen(this._upperSocketServer),
			handleListen(this._querySocketServer),
		])
		// All sockets are open and listening at this point
	}

	/** */
	private _registerIncomingClient(client: SocketDescription) {
		const socketID = MosConnection.nextSocketID

		this.emit(
			'rawMessage',
			'incoming_' + socketID,
			'newConnection',
			'From ' + client.socket.remoteAddress + ':' + client.socket.remotePort
		)

		const messageParser = new MosMessageParser(
			`${socketID}, ${client.socket.remoteAddress}, ${client.portDescription}`
		)
		// messageParser.debug = this._debug
		messageParser.on('message', (message: any, messageString: string) => {
			// Handle incoming data
			handleMessage(message, messageString).catch((err) => this.emit('error', err))
		})

		// handles socket listeners
		client.socket.on('close', (/*hadError: boolean*/) => {
			this._disposeIncomingSocket(socketID)
			this.emit('rawMessage', 'incoming_' + socketID, 'closedConnection', '')
		})
		client.socket.on('end', () => {
			this.debugTrace('Socket End')
		})
		client.socket.on('drain', () => {
			this.debugTrace('Socket Drain')
		})
		client.socket.on('data', (data: Buffer) => {
			const messageString = iconv.decode(data, 'utf16-be')

			this.emit('rawMessage', 'incoming', 'recieved', messageString)

			try {
				messageParser.debug = this._debug
				messageParser.parseMessage(messageString)
			} catch (err) {
				this.emit('error', err)
			}
		})
		const handleMessage = async (parsed: any, _messageString: string) => {
			const remoteAddressContent = client.socket.remoteAddress
				? client.socket.remoteAddress.split(':')
				: undefined
			const remoteAddress = remoteAddressContent ? remoteAddressContent[remoteAddressContent.length - 1] : ''

			const ncsID = parsed.mos.ncsID
			const mosID = parsed.mos.mosID
			const mosMessageId: number = parsed.mos.messageID

			let mosDevice = this._mosDevices[ncsID + '_' + mosID] || this._mosDevices[mosID + '_' + ncsID]

			const sendReply = (message: MosModel.MosMessage) => {
				message.ncsID = ncsID
				message.mosID = mosID
				message.prepare(mosMessageId)
				const sendMessageString: string = message.toString()
				const buf = iconv.encode(sendMessageString, 'utf16-be')
				client.socket.write(buf)

				this.emit('rawMessage', 'incoming_' + socketID, 'sent', sendMessageString)
			}
			if (!mosDevice && this._conf.openRelay) {
				// No MOS-device found in the register
				// Register a new mosDevice to use for this connection:
				if (ncsID === this._conf.mosID) {
					// Setup a "primary" connection back to the mos-device, so that we can automatically
					// send commands to it through the mosDevice

					const primary = new NCSServerConnection(
						mosID,
						remoteAddress,
						this._conf.mosID,
						undefined,
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
					const openRelayOptions: IMOSDeviceConnectionOptions['primary'] | undefined =
						typeof this._conf.openRelay === 'object' ? this._conf.openRelay.options : undefined

					primary.createClient(
						MosConnection.nextSocketID,
						openRelayOptions?.ports?.lower ?? MosConnection.CONNECTION_PORT_LOWER,
						'lower',
						true
					)
					primary.createClient(
						MosConnection.nextSocketID,
						openRelayOptions?.ports?.upper ?? MosConnection.CONNECTION_PORT_UPPER,
						'upper',
						true
					)

					mosDevice = this._registerMosDevice(this._conf.mosID, mosID, null, primary, null)
				} else if (mosID === this._conf.mosID) {
					mosDevice = await this.connect({
						primary: {
							id: ncsID,
							host: remoteAddress,
						},
					})
				}
			}
			if (mosDevice) {
				mosDevice
					.routeData(parsed, client.portDescription)
					.then((message: MosModel.MosMessage) => {
						sendReply(message)
					})
					.catch((err: Error | MosModel.MosMessage) => {
						// Something went wrong
						if (err instanceof MosModel.MosMessage) {
							sendReply(err)
						} else {
							// Unknown / internal error
							// Log error:
							this.emit('warning', 'Error when handling incoming data: ' + err)
							// reply with NACK:
							// TODO: implement ACK
							// https://mosprotocol.com/wp-content/MOS-Protocol-Documents/MOS_Protocol_Version_2.8.5_Final.htm#mosAck
							const msg = new MosModel.MOSAck(
								{
									ID: this.mosTypes.mosString128.create(0),
									Revision: 0,
									Description: this.mosTypes.mosString128.create(
										`MosDevice "${ncsID + '_' + mosID}" not found`
									),
									Status: IMOSAckStatus.NACK,
								},
								this.mosTypes.strict
							)
							sendReply(msg) // TODO: Need tests
						}
					})
			} else {
				// No MOS-device found in the register

				// We can't handle the message, reply with a NACK:
				const msg = new MosModel.MOSAck(
					{
						ID: this.mosTypes.mosString128.create(0),
						Revision: 0,
						Description: this.mosTypes.mosString128.create('MosDevice not found'),
						Status: IMOSAckStatus.NACK,
					},
					this.mosTypes.strict
				)

				sendReply(msg) // TODO: Need tests
			}
		}
		client.socket.on('error', (e: Error) => {
			this.emit(
				'error',
				`Socket had error (${socketID}, ${client.socket.remoteAddress}, ${client.portDescription}): ${e}`
			)
			this.debugTrace(
				`Socket had error (${socketID}, ${client.socket.remoteAddress}, ${client.portDescription}): ${e}`
			)
		})

		// Register this socket:
		this._incomingSockets[socketID + ''] = client
		this.debugTrace('Added socket: ', socketID)
	}
	/** Close socket and clean up */
	private _disposeIncomingSocket(socketID: string) {
		const e = this._incomingSockets[socketID + '']
		if (e) {
			e.socket.removeAllListeners()
			e.socket.destroy()
		}
		delete this._incomingSockets[socketID + '']
		this.debugTrace('removed: ', socketID, '\n')
	}
	/** Get new unique id */
	static get nextSocketID(): string {
		return this._nextSocketID++ + ''
	}
	private debugTrace(...strs: any[]) {
		// eslint-disable-next-line no-console
		if (this._debug) console.log(...strs)
	}
	private _scheduleCheckProfileValidness(orgStack: Error): void {
		if (this._scheduleCheckProfileValidnessTimeout) return
		this._scheduleCheckProfileValidnessTimeout = setTimeout(() => {
			this._scheduleCheckProfileValidnessTimeout = null
			if (this._disposed) return
			try {
				this._checkProfileValidness(orgStack)
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(e)
			}
		}, PROFILE_VALIDNESS_CHECK_WAIT_TIME)
	}

	/**
	 * Checks that all callbacks have been set up properly, according to which MOS-profile have been set in the options.
	 * throws if something's wrong
	 */
	private _checkProfileValidness(orgStack: Error): void {
		if (!this._conf.strict) return

		const fixError = (message: string) => {
			// Change the stack of the error, so that it points to the original call to the MosDevice:
			const err = new Error(message)
			err.stack = message + orgStack.stack
			return err
		}

		if (this.listenerCount('error') === 0) {
			throw fixError(`Error: no listener for the "error" event has been set up for MosConnection!`)
		}
		if (this.listenerCount('warning') === 0) {
			throw fixError(`Error: no listener for the "warning" event has been set up for MosConnection!`)
		}
	}
}
