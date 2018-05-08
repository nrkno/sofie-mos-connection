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
		if (this._debug) console.log('listen', this._portDescription, this._port)
		return new Promise((resolve, reject) => {
			try {

				if (this._debug) console.log('inside promise', this._portDescription, this._port)
				// already listening
				if (this._socketServer.listening) {
					if (this._debug) console.log('already listening', this._portDescription, this._port)
					resolve()
					return
				}
				// handles listening-listeners and cleans up
				let handleListeningStatus = (e?: Error) => {
					if (this._debug) console.log('handleListeningStatus')
					this._socketServer.removeListener('listening', handleListeningStatus)
					this._socketServer.removeListener('close', handleListeningStatus)
					this._socketServer.removeListener('error', handleListeningStatus)
					if (this._socketServer.listening) {
						if (this._debug) console.log('listening', this._portDescription, this._port)
						resolve()
					} else {
						if (this._debug) console.log('not listening', this._portDescription, this._port)
						reject(e || false)
					}
				}

				// listens and handles error and events
				this._socketServer.on('listening', () => {
					if (this._debug) console.log('listening!!')
				})
				this._socketServer.once('listening', handleListeningStatus)
				this._socketServer.once('close', handleListeningStatus)
				this._socketServer.once('error', handleListeningStatus)
				this._socketServer.listen(this._port)
			} catch (e) {
				reject(e)
			}
		})
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
		if (this._debug) console.log('Server error:', error)
	}

	/** */
	private _onServerClose () {
		// @todo: implement
		if (this._debug) console.log(`Server closed: on port ${this._port}`)
	}
}
