import { ConnectionType } from './socketConnection'
import { MosSocketClient } from '../connection/mosSocketClient'
import { MosMessage } from '../mosModel/MosMessage'
import { HeartBeat } from '../mosModel/0_heartBeat'

// import {ProfilesSupport} from '../config/connectionConfig';
// import {Socket} from 'net';
export interface ClientDescription {
	client: MosSocketClient
	clientDescription: string
}

// Namnförslag: NCSServer
// Vi ansluter från oss till NCS
/** */
export class NCSServerConnection {
	private _connected: boolean
	// private _lastSeen: number
	private _id: string
	private _host: string
	private _timeout: number
	private _mosID: string
	private _debug: boolean = false

	private _clients: {[clientID: string]: ClientDescription} = {}
	private _callbackOnConnectionChange: () => void

	private _heartBeatsTimer: NodeJS.Timer
	private _heartBeatsDelay: number

	constructor (id: string, host: string, mosID: string, timeout?: number, debug?: boolean) {
		this._id = id
		this._host = host
		this._timeout = timeout || 5000
		this._heartBeatsDelay = this._timeout / 2
		this._mosID = mosID
		this._connected = false
		if (debug) this._debug = debug
	}

	/** */
	registerOutgoingConnection (clientID: string, client: MosSocketClient, clientDescription: ConnectionType) {
		if (this._debug) console.log('registerOutgoingConnection', clientID)
		this._clients[clientID] = {
			client: client,
			clientDescription: clientDescription
		}
	}

	createClient (clientID: string, port: number, clientDescription: ConnectionType) {
		this.registerOutgoingConnection(clientID, new MosSocketClient(this._host, port, clientDescription, this._debug), clientDescription)
	}

	/** */
	removeClient (clientID: string) {
		this._clients[clientID].client.dispose()
		delete this._clients[clientID]
	}

	connect () {
		for (let i in this._clients) {
			// Connect client
			if (this._debug) console.log(`Connect client ${i} on ${this._clients[i].clientDescription} on host ${this._host}`)
			this._clients[i].client.connect()
		}
		this._connected = true

		// Send heartbeat and check connection
		this._heartBeatsTimer = global.setInterval(() => this._sendHeartBeats(), this._heartBeatsDelay)

		// Emit to _callbackOnConnectionChange
		if (this._callbackOnConnectionChange) this._callbackOnConnectionChange()
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
			throw Error('Unknown port name: "' + message.port + '"')
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
				reject('No clients found')
			}
		})
	}

	onConnectionChange (cb: () => void) {
		this._callbackOnConnectionChange = cb
	}

	get connected (): boolean {
		return this._connected
	}

	/** */
	get lowerPortClients (): MosSocketClient[] {
		let clients: MosSocketClient[] = []
		for (let i in this._clients) {
			if (this._clients[i].clientDescription === 'lower') {
				clients.push(this._clients[i].client)
			}
		}

		return clients
	}

	/** */
	get upperPortClients (): MosSocketClient[] {
		let clients: MosSocketClient[] = []
		for (let i in this._clients) {
			if (this._clients[i].clientDescription === 'upper') {
				clients.push(this._clients[i].client)
			}
		}

		return clients
	}

	/** */
	get queryPortClients (): MosSocketClient[] {
		let clients: MosSocketClient[] = []
		for (let i in this._clients) {
			if (this._clients[i].clientDescription === 'query') {
				clients.push(this._clients[i].client)
			}
		}

		return clients
	}

	dispose (): Promise<void> {
		return	new Promise((resolveDispose) => {
			for (let key in this._clients) {
				this.removeClient(key)
			}
			global.clearInterval(this._heartBeatsTimer)
			this._connected = false
			if (this._callbackOnConnectionChange) this._callbackOnConnectionChange()
			resolveDispose()
		})
	}

	private _sendHeartBeats (): Promise<any[]> {
		return Promise.all(
			Object.keys(this._clients).map((key) => {
				let heartbeat = new HeartBeat()
				heartbeat.port = this._clients[key].clientDescription
				return this.executeCommand(heartbeat)
				.then((data) => {
					if (this._debug) console.log(`Heartbeat on ${this._clients[key].clientDescription} received.`, data)
				})
			})
		)
	}
}
