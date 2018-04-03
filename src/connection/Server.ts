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

// Namnförslag: NCSServer
// Vi ansluter från oss till NCS
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
	// Döp om till outgoing
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

			// TODO: Send heartbeat with executeCommand
		}
		this._connected = true
	}

	executeCommand (message: MosMessage): Promise<any> {
		// Fill with clients
		let clients

		// Set mosID and ncsID
		// Definer port info i MosMessage, slip switch
		message.mosID = this._mosID
		message.ncsID = this._id

		// Example: Port based on message type
		if (message instanceof ReqMachInfo) {
			clients = this.lowerPortClients
		} else {
			clients = this.upperPortClients
		}

		return new Promise((resolve, reject) => {
			clients[0].queueCommand(message, (data) => {
				resolve(data)
			})
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
}
