import { EventEmitter } from 'events'

import { Server } from 'net'
import { SocketMock } from './socket'
// import { Writable } from 'stream'

const iconv = require('iconv-lite')
iconv.encodingExists('utf16-be')

// Mock the Server class in 'net':
let setTimeoutOrg = setTimeout

let instances: Array<IServerMock> = []

export class ServerMock extends EventEmitter implements Server {
	// Mock implementation:

	maxConnections: number
	connections: number
	listening: boolean
	listenToPort: number

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

	listen (port) {

		this.listenToPort = port
		setTimeoutOrg(() => {
			this.listening = true
			this.emit('listening', {})
		},1)
		return this
	}
	close (callback?: Function) {
		if (callback) callback()
		setTimeoutOrg(() => {
			this.emit('close')
		},1)
		return this
	}
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

			setTimeoutOrg(() => {

				if (typeof cb === 'string') {
					msg = cb
				} else {
					msg = cb(data)
				}

				this.mockReceiveMessage(msg)
			},1)
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
	decode (data: Buffer): string {
		return iconv.decode(data, 'utf16-be')
	}
	encode (str: string) {
		return iconv.encode(str, 'utf16-be')
	}
}

export type IServerMock = jest.Mocked<ServerMock>
