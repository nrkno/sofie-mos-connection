import {Server, Socket, createServer} from 'net'
import {EventEmitter} from 'events'
import { ConnectionManager } from './connectionManager';
import { IncomingConnectionType } from './socketConnection';

export class MosSocketServer extends EventEmitter {

	private _port: number
	private _description: IncomingConnectionType
	private _connectionManager: ConnectionManager
	private _server: Server

	/** */
	constructor (port: number, description: IncomingConnectionType, connectionManager: ConnectionManager) {
		super()
		this._port = port
		this._description = description
		this._connectionManager = connectionManager

		this._server = createServer()
		this._server.once('connection', (socket: Socket) => this._onClientConnection(socket))
		this._server.once('close', () => this._onServerClose())
		this._server.once('error', (error) => this._onServerError(error))
	}

	/** */
	listen (): Promise<boolean> {
		return	new Promise((resolve, reject) => {

			// already listening
			if (this._server.listening) {
				resolve(true)
				return
			}

			// handles listening-listeners and cleans up
			let handleListeningStatus = (e?: Error) => {
				this._server.removeListener('listening', handleListeningStatus)
				this._server.removeListener('close', handleListeningStatus)
				this._server.removeListener('error', handleListeningStatus)
				if (this._server.listening) {
					resolve(true)
				}else {
					reject(e || false)
				}
			}

			// listens and handles error and events
			this._server.once('listening', handleListeningStatus)
			this._server.once('close', handleListeningStatus)
			this._server.once('error', handleListeningStatus)

			this._server.listen(this._port)
		})
	}

	/** */
	dispose (): Promise<void > {
		return	new Promise((outerResolve) => {
			let closePromises: Promise<void>[] = []

			// close clients
			this._connectionManager.getSocketsFor(this._description).forEach(socket => {
				closePromises.push(
					new Promise((resolve) => {
						socket._client.on('close', resolve)
						socket._client.end()
						socket._client.destroy()
					})
				)
			})

			// close server
			closePromises.push(
				new Promise((resolve) => {
					this._server.on('close', resolve)
					this._server.close()
				})
			)

			Promise.all(closePromises).then(() => outerResolve())
		})

	}
	
	/** */
	private _onClientConnection (socket: Socket) {
		this._connectionManager.register(new IncomingConnection(socket, this._description))
		console.log('Connected:', socket)
	}
	
	/** */
	private _onServerError (error: Error) {
		// @todo: implement
		console.log('Server error:', error)
	}
	
	/** */
	private _onServerClose () {
		// @todo: implement
		console.log(`Server closed: "${this._description}", on port ${this._port}`)
	}
}
