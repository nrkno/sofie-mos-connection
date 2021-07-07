import { ConnectionType } from './socketConnection'
import { MosSocketClient, CallBackFunction, QueueMessage } from '../connection/mosSocketClient'
import { MosMessage, PortType } from '../mosModel/MosMessage'
import { HeartBeat } from '../mosModel'
import { EventEmitter } from 'events'

// import {ProfilesSupport} from '../config/connectionConfig';
// import {Socket} from 'net';
export interface ClientDescription {
	useHeartbeats: boolean
	heartbeatConnected: boolean
	client: MosSocketClient
	clientDescription: PortType
}

export interface INCSServerConnection {
	on (event: 'rawMessage', listener: (type: string, message: string) => void): this
}

export interface HandedOverQueue {
	messages: QueueMessage[], callbacks: { [messageId: string]: CallBackFunction }
}

/** Handles connections to a NCS (server) */
export class NCSServerConnection extends EventEmitter implements INCSServerConnection {
	private _connected: boolean
	// private _lastSeen: number
	private _id: string
	private _host: string
	private _timeout: number
	private _mosID: string
	private _debug: boolean
	private _disposed: boolean = false

	private _clients: {[clientID: string]: ClientDescription} = {}

	private _emittedConnected = false

	private _heartBeatsTimer: NodeJS.Timer
	private _heartBeatsDelay: number

	constructor (id: string, host: string, mosID: string, timeout: number | undefined, debug: boolean) {
		super()
		this._id = id
		this._host = host
		this._timeout = timeout || 5000
		this._heartBeatsDelay = this._timeout / 2
		this._mosID = mosID
		this._connected = false
		this._debug = debug ?? false
	}
	/** Create a MOS client, which talks to  */
	createClient (clientID: string, port: number, clientDescription: ConnectionType, useHeartbeats: boolean) {
		let client = new MosSocketClient(this._host, port, clientDescription, this._timeout, this._debug)
		this.debugTrace('registerOutgoingConnection', clientID)

		this._clients[clientID] = {
			useHeartbeats: useHeartbeats,
			heartbeatConnected: false,
			client: client,
			clientDescription: clientDescription
		}
		client.on('rawMessage', (type: string, message: string) => {
			this.emit('rawMessage', type, message)
		})
		client.on('warning', (str: string) => {
			this.emit('warning', 'MosSocketClient: ' + str)
		})
		client.on('error', (str: string) => {
			this.emit('error', 'MosSocketClient: ' + str)
		})
	}

	/** */
	removeClient (clientID: string) {
		this._clients[clientID].client.dispose()
		delete this._clients[clientID]
	}

	connect () {
		for (let i in this._clients) {
			// Connect client
			this.emit('info', `Connect client ${i} on ${this._clients[i].clientDescription} on host ${this._host} (${this._clients[i].client.port})`)
			this.debugTrace(`Connect client ${i} on ${this._clients[i].clientDescription} on host ${this._host} (${this._clients[i].client.port})`)
			this._clients[i].client.connect()
		}
		this._connected = true

		// Send heartbeat and check connection
		this._sendHeartBeats()

		// Emit to _callbackOnConnectionChange
		// if (this._callbackOnConnectionChange) this._callbackOnConnectionChange()
	}

	executeCommand (message: MosMessage): Promise<any> {
		// Fill with clients
		let clients: Array<MosSocketClient>

		// Set mosID and ncsID
		message.mosID = this._mosID
		message.ncsID = this._id

		// Example: Port based on message type
		if (message.port === 'lower') {
			clients = this.lowerPortClients
		} else if (message.port === 'upper') {
			clients = this.upperPortClients
		} else if (message.port === 'query') {
			clients = this.queryPortClients
		} else {
			throw Error(`No "${message.port}" ports found`)
		}
		return new Promise((resolve, reject) => {
			if (clients && clients.length) {
				clients[0].queueCommand(message, (err, data) => {
					if (err) {
						reject(err)
					} else {
						resolve(data)
					}
				})
			} else {
				reject('executeCommand: No clients found for ' + message.port)
			}
		})
	}

	public setDebug (debug: boolean) {
		this._debug = debug

		Object.keys(this._clients).forEach((clientID) => {
			let cd = this._clients[clientID]
			if (cd) {
				cd.client.setDebug(debug)
			}
		})
	}
	get connected (): boolean {

		if (!this._connected) return false
		let connected = true
		Object.keys(this._clients).forEach(key => {
			let client = this._clients[key]
			if (client.useHeartbeats && !client.heartbeatConnected) {
				connected = false
			}
		})
		return connected
	}

	private _getClients (clientDescription: string): MosSocketClient[] {
		let clients: MosSocketClient[] = []
		for (let i in this._clients) {
			if (this._clients[i].clientDescription === clientDescription) {
				clients.push(this._clients[i].client)
			}
		}

		return clients
	}
	/** */
	get lowerPortClients (): MosSocketClient[] {
		return this._getClients('lower')
	}

	/** */
	get upperPortClients (): MosSocketClient[] {
		return this._getClients('upper')
	}

	/** */
	get queryPortClients (): MosSocketClient[] {
		return this._getClients('query')
	}
	get host (): string {
		return this._host
	}
	get id (): string {
		return this._id
	}

	handOverQueue (otherConnection: NCSServerConnection) {
		const cmds: { [clientId: string]: HandedOverQueue } = {}
		// this._clients.forEach((client, id) => {
		// 	// cmds[id] = client.client.handOverQueue()
		// })
		this.debugTrace(this.id + ' ' + this.host + ' handOverQueue')

		for (const id in this._clients) {
			cmds[id] = this._clients[id].client.handOverQueue()
		}
		otherConnection.receiveQueue(cmds)
	}
	receiveQueue (queue: { [clientId: string]: HandedOverQueue }) {
		// @todo: keep order
		// @todo: prevent callback-promise horror...
		for (const clientId of Object.keys(queue)) {
			for (const msg of queue[clientId].messages) {
				this.executeCommand(msg.msg).then((data) => {
					const cb = queue[clientId].callbacks[msg.msg.messageID]
					if (cb) {
						cb(null, data)
					}
				}, (err) => {
					const cb = queue[clientId].callbacks[msg.msg.messageID]
					if (cb) {
						cb(null, err)
					}
				})
			}
		}
	}

	dispose (): Promise<void> {
		this._disposed = true
		return new Promise((resolveDispose) => {
			for (let key in this._clients) {
				this.removeClient(key)
			}
			global.clearTimeout(this._heartBeatsTimer)
			this._connected = false
			this.emit('connectionChanged')
			resolveDispose()
		})
	}

	private _sendHeartBeats (): void {
		if (this._heartBeatsTimer) clearTimeout(this._heartBeatsTimer)
		if (this._disposed) return

		let triggerNextHeartBeat = () => {
			this._heartBeatsTimer = global.setTimeout(() => {
				if (!this._disposed) {
					this._sendHeartBeats()
				}
			}, this._heartBeatsDelay)
		}

		Promise.all(
			Object.keys(this._clients).map((key) => {
				let client = this._clients[key]

				if (client.useHeartbeats) {
					let heartbeat = new HeartBeat(this._clients[key].clientDescription)
					return this.executeCommand(heartbeat)
					.then(() => {
						client.heartbeatConnected = true
						this.debugTrace(`Heartbeat on ${this._clients[key].clientDescription} received.`)
					})
					.catch((e) => {
						// probably a timeout
						client.heartbeatConnected = false
						this.emit('error', `Heartbeat error on ${this._clients[key].clientDescription}: ${e.toString()}`)
						this.debugTrace(`Heartbeat on ${this._clients[key].clientDescription}: ${e.toString()}`)
					})
				} else {
					return Promise.resolve()
				}

			})
		)
		.catch((e) => {
			triggerNextHeartBeat()
			this.emit('error', e)
		})
		.then(() => {
			let connected = this.connected
			if (connected !== this._emittedConnected) {
				this._emittedConnected = connected
				this.emit('connectionChanged')
			}
			triggerNextHeartBeat()
		})
		.catch((e) => {
			this.emit('error', e)
		})
	}
	private debugTrace (...strs: any[]) {
		if (this._debug) console.log(...strs)
	}
}
