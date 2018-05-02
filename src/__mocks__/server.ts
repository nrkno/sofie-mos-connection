import { EventEmitter } from 'events'

import { Server } from 'net'
import { SocketMock } from './socket'
// import { Writable } from 'stream'

// Mock the Server class in 'net':

let instances: Array<IServerMock> = []

export class ServerMock extends EventEmitter implements Server {
	// Mock implementation:

	maxConnections: number
	connections: number
	listening: boolean
	private _responses: Array<(data: any) => string | Buffer > = []

	constructor () {
		super()

		// @ts-ignore this is comparable with ISocketMock
		instances.push(this)

		this.listen = jest.fn(this.listen)
		this.close = jest.fn(this.close)
		this.address = jest.fn(this.address)
		this.getConnections = jest.fn(this.getConnections)
		this.ref = jest.fn(this.ref)
		this.unref = jest.fn(this.unref)
		// this.addListener = jest.fn(this.addListener)
		// this.emit = jest.fn(this.emit)
		// this.on = jest.fn(this.on)
		// this.once = jest.fn(this.once)
		// this.prependListener = jest.fn(this.prependListener)
		// this.prependOnceListener = jest.fn(this.prependOnceListener)

	}
	static mockClear () {
		instances.splice(0, 9999)
	}
	static get instances () {
		return instances
	}

	listen () {
		setTimeout(() => {
			this.listening = true
			this.emit('listening', {})
		},5)
		return this
	}
	close (callback?: Function) { if (callback) callback(); return this }
	address () { return { port: 0, family: 'string', address: 'string' } }
	getConnections (cb: (error: Error | null, count: number) => void) { cb(null, 0) }
	ref () { return this }
	unref () { return this }
	// addListener (event: string, listener: (...args: any[]) => void) { return this }
	// emit (event: string | symbol, ...args: any[]) { return true }
	// on (event: string, listener: (...args: any[]) => void) { return this }
	// once (event: string, listener: (...args: any[]) => void) { return this }
	// prependListener (event: string, listener: (...args: any[]) => void) { return this }
	// prependOnceListener (event: string, listener: (...args: any[]) => void) { return this }
	// ------------------------------------------------------------------------
	// Mock methods:
	mockNewConnection () {
		// "Someone has connected"
		// console.log('mock connection')
		let socket = new SocketMock()
		socket.on('data', (d) => {
			this.emit('data', d)
		})

		this.emit('connection', socket)

		return socket
	}

	mockSentMessage (data, encoding) {
		encoding = encoding
		if (this._responses.length) {
			// send reply:

			let cb: any = this._responses.shift()
			let msg

			setTimeout(() => {

				if (typeof cb === 'string') {
					msg = cb
				} else {
					msg = cb(data)
				}

				this.mockReceiveMessage(msg)
			},5)
		}
	}
	mockReceiveMessage (msg: string | Buffer) {
		this.emit('data', msg)
	}
	mockAddReply (cb: (data: any) => string | Buffer) {
		this._responses.push(cb)
	}
	mockClear () {
		this._responses.splice(0, 9999)
	}
}

export type IServerMock = jest.Mocked<ServerMock>
