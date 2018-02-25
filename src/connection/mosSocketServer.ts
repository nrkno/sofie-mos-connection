import {Server, Socket, createServer} from 'net'
import {EventEmitter} from 'events'

export class MosSocketServer extends EventEmitter {

	private _port: number
	private _description: string
	private _server: Server
	private _clients: Socket[] = [] // @todo: lifetime/relation between this and connectionmanager??????

	/** */
	constructor (port: number, description: 'upper' | 'query') {
		super()
		this._port = port
		this._description = description
		this._server = createServer()
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
			this._clients.forEach(client => {
				closePromises.push(
					new Promise((resolve) => {
						client.on('close', resolve)
						client.end()
						client.destroy()
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

			Promise.all(closePromises).then(() => outerResolve)
		})
	}
}
