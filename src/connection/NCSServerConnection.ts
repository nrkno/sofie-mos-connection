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
	private _mosID: string

	private _clients: {[clientID: number]: ClientDescription} = {}

	constructor (id: string, host: string, mosID: string) {
		this._id = id
		this._host = host
		this._mosID = mosID
		this._connected = false
	}

	/** */
	registerOutgoingConnection (clientID: number, client: MosSocketClient, clientDescription: ConnectionType) {
		console.log('registerOutgoingConnection', clientID)
		this._clients[clientID] = {
			client: client,
			clientDescription: clientDescription
		}
	}
	
	createClient (clientID: number, port: number, clientDescription: ConnectionType) {
		this.registerOutgoingConnection(clientID, new MosSocketClient(this._host, port, clientDescription), clientDescription)
	}

	/** */
	removeClient (clientID: number) {
		this._clients[clientID].client.dispose()
		delete this._clients[clientID]
	}

	connect () {
		for (let i in this._clients) {
			// Connect client
			console.log(`Connect client ${i} on ${this._clients[i].clientDescription} on host ${this._host}`)
			this._clients[i].client.connect()

			// Send heartbeat and check connection
			let heartbeat = new HeartBeat()
			heartbeat.port = this._clients[i].clientDescription
			this.executeCommand(heartbeat).then((data) => {
				console.log(`Heartbeat on ${this._clients[i].clientDescription} received.`, data)
			})
		}
		this._connected = true
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
		} else if(message.port === 'upper') {
			clients = this.upperPortClients
		} else {
			clients = this.queryPortClients
		}

		return new Promise((resolve, reject) => {
			if(clients && clients.length) {
				clients[0].queueCommand(message, (data) => {
					resolve(data)
				})
			} else {
				reject('No clients found')
			}
		})
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
			for (let i in this._clients) {
				this.removeClient(i)
			}
			resolveDispose()
		})
	}
}
