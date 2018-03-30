import { Server, Socket } from 'net'
import { EventEmitter } from 'events'
import { IncomingConnectionType, SocketServerEvent } from './socketConnection'

export class MosSocketServer extends EventEmitter {

	private _port: number
	private _portDescription: IncomingConnectionType
	private _socketServer: Server

	/** */
	constructor (port: number, description: IncomingConnectionType) {
		super()
		this._port = port
		this._portDescription = description

		this._socketServer = new Server()
		this._socketServer.on('connection', (socket: Socket) => this._onClientConnection(socket))
		this._socketServer.on('close', () => this._onServerClose())
		this._socketServer.on('error', (error) => this._onServerError(error))
	}

	/** */
	listen (): Promise<boolean> {
		console.log('listen', this._portDescription, this._port)
		return new Promise((resolve, reject) => {
			console.log('inside promise', this._portDescription, this._port)

			// already listening
			if (this._socketServer.listening) {
				console.log('already listening', this._portDescription, this._port)
				resolve(true)
				return
			}

			// handles listening-listeners and cleans up
			let handleListeningStatus = (e?: Error) => {
				console.log('handleListeningStatus')
				this._socketServer.removeListener('listening', handleListeningStatus)
				this._socketServer.removeListener('close', handleListeningStatus)
				this._socketServer.removeListener('error', handleListeningStatus)
				if (this._socketServer.listening) {
					console.log('listening', this._portDescription, this._port)
					resolve(true)
				} else {
					console.log('not listening', this._portDescription, this._port)
					reject(e || false)
				}
			}

			// listens and handles error and events
			this._socketServer.on('listening', () => {
				console.log('listening!!')
			})
			this._socketServer.once('listening', handleListeningStatus)
			this._socketServer.once('close', handleListeningStatus)
			this._socketServer.once('error', handleListeningStatus)

			this._socketServer.listen(this._port)
		})
	}

	/** */
	dispose (sockets: Socket[]): Promise<void > {
		return	new Promise((resolveDispose) => {
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
					this._socketServer.on('close', resolve)
					this._socketServer.close()
				})
			)
			Promise.all(closePromises).then(() => resolveDispose())
		})
	}

	/** */
	private _onClientConnection (socket: Socket) {
		this.emit(SocketServerEvent.CLIENT_CONNECTED, {
			socket: socket,
			portDescription: this._portDescription
		})
	}

	/** */
	private _onServerError (error: Error) {
		// @todo: implement
		console.log('Server error:', error)
	}

	/** */
	private _onServerClose () {
		// @todo: implement
		console.log(`Server closed: on port ${this._port}`)
	}
}
