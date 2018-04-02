import { ConnectionType } from './socketConnection'
import { MosSocketClient } from '../connection/mosSocketClient'

// import {ProfilesSupport} from '../config/connectionConfig';
// import {Socket} from 'net';
export interface ClientDescription {
	client: MosSocketClient
	clientDescription: string
}

/** */
export class Server {
	private _connected: boolean
	// private _lastSeen: number
	private _host: string

	private _clients: {[clientID: number]: ClientDescription} = {}

	constructor (host: string) {
		this._host = host
		this._connected = false
	}

	/** */
	registerIncomingConnection (clientID: number, client: MosSocketClient, clientDescription: ConnectionType) {
		console.log('registerIncomingConnection', clientID)
		this._clients[clientID] = {
			client: client,
			clientDescription: clientDescription
		}
	}
	
	createClient (clientID: number, port: number, clientDescription: ConnectionType) {
		this.registerIncomingConnection(clientID, new MosSocketClient(this._host, port, clientDescription), clientDescription)
	}

	/** */
	removeClient (clientID: number) {
		this._clients[clientID].client.dispose()
		delete this._clients[clientID]
	}

	connect () {
		for (let i in this._clients) {
			console.log('connect', i)
			this._clients[i].client.connect()
		}
		this._connected = true
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
}
