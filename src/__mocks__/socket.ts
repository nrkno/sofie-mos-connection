import { EventEmitter } from 'events'

import { Socket } from 'net'
import { Writable } from 'stream'

// Mock the Socket class in 'net':

let instances: Array<ISocketMock> = []

export class SocketMock extends EventEmitter implements Socket {
	// Mock implementation:
	bufferSize: number
	remoteAddress: string
	remoteFamily: string
	remotePort: number
	localAddress: string
	localPort: number
	bytesRead: number
	bytesWritten: number
	connecting: boolean
	destroyed: boolean
	writable: boolean
	readable: boolean

	private _responses: Array<(data: any) => string | Buffer > = []

	constructor () {
		super()

		// @ts-ignore this is comparable with ISocketMock
		instances.push(this)

		// Wrap member functions in mocks:
		this.connect = jest.fn(this.connect)
		this.setEncoding = jest.fn(this.setEncoding)
		this.destroy = jest.fn(this.destroy)
		this.pause = jest.fn(this.pause)
		this.resume = jest.fn(this.resume)
		this.setTimeout = jest.fn(this.setTimeout)
		this.setNoDelay = jest.fn(this.setNoDelay)
		this.setKeepAlive = jest.fn(this.setKeepAlive)
		this.address = jest.fn(this.address)
		this.unref = jest.fn(this.unref)
		this.ref = jest.fn(this.ref)
		this.end = jest.fn(this.end)
		this._write = jest.fn(this._write)
		this.setDefaultEncoding = jest.fn(this.setDefaultEncoding)
		this._read = jest.fn(this._read)
		this.read = jest.fn(this.read)
		this.isPaused = jest.fn(this.isPaused)
		this.pipe = jest.fn(this.pipe)
		this.unpipe = jest.fn(this.unpipe)
		this.unshift = jest.fn(this.unshift)
		this.wrap = jest.fn(this.wrap)
		this.push = jest.fn(this.push)
		this._destroy = jest.fn(this._destroy)
		this._final = jest.fn(this._final)
		this.cork = jest.fn(this.cork)
		this.uncork = jest.fn(this.uncork)

		this.mockSentMessage = jest.fn(this.mockSentMessage)
	}
	static mockClear () {
		instances.splice(0, 9999)
	}
	static get instances () {
		return instances
	}

	write () {
		this.mockSentMessage.apply(this, arguments)
		return true
	}
	connect () { return this }
	setEncoding () { return this }
	destroy () { /* nothing */ }
	pause () { return this }
	resume () { return this }
	setTimeout (timeout: number, callback?: Function) { return this }
	setNoDelay (noDelay?: boolean) { return this }
	setKeepAlive (enable?: boolean, initialDelay?: number) { return this }
	address () { return {port: 100, family: 'localhost', address: '127.0.0.1'} }
	unref () { /* nothing */ }
	ref () { /* nothing */ }
	end () { /* nothing */ }
	_write (chunk: any, encoding: string, callback: Function) { /* nothing */ }
	setDefaultEncoding (encoding: string) { return this }
	_read (size: number) { /* nothing */ }
	read (size?: number) { /* nothing */ }
	isPaused () { return false }
	pipe (destination, options?: { end?: boolean; }) { return destination }
	unpipe (destination) { return this }
	unshift (chunk: any) { /* nothing */ }
	wrap (oldStream: NodeJS.ReadableStream) { return this }
	push (chunk: any, encoding?: string) { return true }
	_destroy () { /* nothing */ }
	_final () { /* nothing */ }
	cork () { /* nothing */ }
	uncork () { /* nothing */ }

	// ------------------------------------------------------------------------
	// Mock methods:
	mockSentMessage (data, encoding) {

		if (this._responses.length) {
			// send reply:

			let cb = this._responses.shift()
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

export type ISocketMock = jest.Mocked<SocketMock>
