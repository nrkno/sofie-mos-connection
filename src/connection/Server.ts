import { ConnectionType } from './socketConnection'
import { MosSocketClient } from '../connection/mosSocketClient'
import { MosMessage } from '../mosModel/MosMessage'
import { HeartBeat } from '../mosModel/0_heartBeat'
import { ReqMachInfo } from '../mosModel/0_reqMachInfo'

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
			// Connect client
			console.log(`Connect client ${i} on ${this._clients[i].clientDescription} on host ${this._host}`)
			this._clients[i].client.connect()

			// Create a heartbeat and send over to verify networkconnection
			console.log(`Sending heartbeat for client ${i}`)
			let hb = new HeartBeat()
			hb.mosID = this._mosID
			hb.ncsID = this._id
			this._clients[i].client.executeCommand(hb)
		}
		this._connected = true
	}

	executeCommand (message: MosMessage): void {
		// Fill with clients
		let clients

		// Set mosID and ncsID
		message.mosID = this.mosID
		message.ncsID = this.id

		// Example: Port based on message type
		if (message instanceof ReqMachInfo) {
			clients = this.lowerPortClients
		} else {
			clients = this.upperPortClients
		}

		clients[0].executeCommand(message)
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
