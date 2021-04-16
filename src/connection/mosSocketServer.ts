import { Server, Socket } from 'net'
import { EventEmitter } from 'events'
import { IncomingConnectionType, SocketServerEvent } from './socketConnection'

export class MosSocketServer extends EventEmitter {

	private _port: number
	private _portDescription: IncomingConnectionType
	private _socketServer: Server
	private _debug: boolean = false
	private _connectedSockets: Array<Socket> = []

	/** */
	constructor (port: number, description: IncomingConnectionType, debug?: boolean) {
		super()
		this._port = port
		this._portDescription = description
		if (debug) this._debug = debug

		this._socketServer = new Server()
		this._socketServer.on('connection', (socket: Socket) => this._onClientConnection(socket))
		this._socketServer.on('close', () => this._onServerClose())
		this._socketServer.on('error', (error) => this._onServerError(error))
	}
	dispose (sockets: Socket[]): Promise<void[]> {
		let closePromises: Promise<void>[] = []

		// close clients
		sockets.forEach(socket => {
			closePromises.push(
				new Promise((resolve) => {
					socket.on('close', resolve)
					socket.end()
					socket.destroy()
				})
			)
		})

		// close server
		closePromises.push(
			new Promise((resolve) => {
				// this._socketServer.on('close', resolve)
				this._socketServer.close(() => {
					resolve()
				})
			})
		)
		// close any server connections:
		this._connectedSockets.forEach((socket: Socket) => {
			socket.destroy()
		})
		return Promise.all(closePromises)
	}

	/** */
	listen (): Promise<void> {
		this.debugTrace('listen', this._portDescription, this._port)
		return new Promise((resolve, reject) => {
			try {

				this.debugTrace('inside promise', this._portDescription, this._port)
				// already listening
				if (this._socketServer.listening) {
					this.debugTrace('already listening', this._portDescription, this._port)
					resolve()
					return
				}

				// Listens and handles error and events
				this._socketServer.once('error', (e) => {
					reject(e)
				})
				this._socketServer.once('close', () => {
					reject(Error('Socket was closed'))
				})
				this._socketServer.once('listening', () => {
					resolve()

					this._socketServer.on('error', (e) => {
						this.emit(SocketServerEvent.ERROR, e)
					})
					this._socketServer.on('close', () => {
						this.emit(SocketServerEvent.CLOSE)
					})
				})

				this._socketServer.listen(this._port)
			} catch (e) {
				reject(e)
			}
		})
	}
	public setDebug (debug: boolean) {
		this._debug = debug
	}
	get port () {
		return this._port
	}
	get portDescription () {
		return this._portDescription
	}

	/** */
	private _onClientConnection (socket: Socket) {
		this._connectedSockets.push(socket)
		socket.on('close', () => {
			let i = this._connectedSockets.indexOf(socket)
			if (i !== -1) {
				this._connectedSockets.splice(i, 1)
			}
		})
		this.emit(SocketServerEvent.CLIENT_CONNECTED, {
			socket: socket,
			portDescription: this._portDescription
		})
	}

	/** */
	private _onServerError (error: Error) {
		// @todo: implement
		this.debugTrace('Server error:', error)
	}

	/** */
	private _onServerClose () {
		// @todo: implement
		this.debugTrace(`Server closed: on port ${this._port}`)
	}
	private debugTrace (...strs: any[]) {
		if (this._debug) console.log(...strs)
	}
}
