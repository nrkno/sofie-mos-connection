import { EventEmitter } from 'events'

import { Socket } from 'net'
import { MosTime } from '../dataTypes/mosTime'

import * as iconv from 'iconv-lite'
iconv.encodingExists('utf16-be')

// Mock the Socket class in 'net':
let setTimeoutOrg = setTimeout

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
	readonly readableEncoding: BufferEncoding | null
	readonly readableEnded: boolean
	readonly readableFlowing: boolean | null

	readonly writableEnded: boolean
	readonly writableFinished: boolean
	readonly writableHighWaterMark: number
	readonly writableLength: number
	readonly writableObjectMode: boolean

	readonly readableHighWaterMark: number
	readonly readableLength: number
	readonly readableObjectMode: boolean

	public name: string
	public connectedPort: number
	public connectedHost: string;

	// @ts-ignore
	[Symbol.asyncIterator](): AsyncIterableIterator<any>

	private _responses: Array<
		string | string[] | false | ((data: any) => string | string[] | Buffer | Buffer[] | false)
	> = []
	private _replyToHeartBeat: boolean = true

	constructor() {
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

		this.mockSentMessage0 = jest.fn(this.mockSentMessage0)
		this.mockSentMessage = jest.fn(this.mockSentMessage)
	}
	static mockClear() {
		instances.splice(0, 9999)
	}
	static get instances() {
		return instances
	}

	write() {
		this.mockSentMessage0.apply(this, arguments)
		return true
	}
	connect(port: any, host: any) {
		this.connectedPort = port
		this.connectedHost = host

		if (this.connectedPort === 10542) {
			// don't reply on heartbeats on query port
			this._replyToHeartBeat = false
		}

		this.emit('connect')
		return this
	}
	setEncoding() {
		return this
	}
	destroy() {
		this.destroyed = true
		this.emit('close')
		/* nothing */
	}
	pause() {
		return this
	}
	resume() {
		return this
	}
	setTimeout(timeout: number, callback?: (...args: any[]) => void) {
		if (callback) setTimeout(callback, timeout)
		return this
	}
	setNoDelay(noDelay?: boolean) {
		noDelay = noDelay
		return this
	}
	setKeepAlive(enable?: boolean, initialDelay?: number) {
		enable = enable
		initialDelay = initialDelay
		return this
	}
	address() {
		return { port: 100, family: 'localhost', address: '127.0.0.1' }
	}
	unref() {
		/* nothing */
	}
	ref() {
		/* nothing */
	}
	end() {
		/* nothing */
	}
	_write(chunk: any, encoding: string, callback: Function) {
		chunk = chunk
		encoding = encoding
		callback() /* nothing */
	}
	setDefaultEncoding(encoding: string) {
		encoding = encoding
		return this
	}
	_read(size: number) {
		size = size
	}
	read(size?: number) {
		size = size
	}
	isPaused() {
		return false
	}
	pipe(destination: any, options?: { end?: boolean }) {
		options = options
		return destination
	}
	unpipe(destination: any) {
		destination = destination
		return this
	}
	unshift(chunk: any) {
		chunk = chunk
	}
	wrap(oldStream: NodeJS.ReadableStream) {
		oldStream = oldStream
		return this
	}
	push(chunk: any, encoding?: string) {
		chunk = chunk
		encoding = encoding
		return true
	}
	_destroy() {
		/* nothing */
	}
	_final() {
		/* nothing */
	}
	cork() {
		/* nothing */
	}
	uncork() {
		/* nothing */
	}

	// ------------------------------------------------------------------------
	// Mock methods:
	mockSentMessage0(data: any, encoding: any) {
		if (this._replyToHeartBeat) {
			const str: string = typeof data === 'string' ? data : this.decode(data)

			if (str.match(/<heartbeat>/)) {
				try {
					let mosID = str.match(/<mosID>([^<]+)<\/mosID>/)![1]
					let ncsID = str.match(/<ncsID>([^<]+)<\/ncsID>/)![1]
					let messageId = str.match(/<messageID>([^<]+)<\/messageID>/)![1]
					let repl = `<mos>
<mosID>${mosID}</mosID>
<ncsID>${ncsID}</ncsID>
<messageID>${messageId}</messageID>\
  <heartbeat>
    <time>${new MosTime().toString()}</time>
  </heartbeat>
</mos>\r\n`
					this.mockReceiveMessage(this.encode(repl))
				} catch (e) {
					console.error('mockReply', str)
					throw e
				}
				return
			}
		}
		this.mockSentMessage(data, encoding)
	}
	mockSentMessage(data: any, _encoding: any) {
		const cb = this._responses.shift()
		if (cb) {
			// send reply:
			setTimeoutOrg(() => {
				const msg = typeof cb === 'function' ? cb(data) : cb
				if (msg) {
					if (Array.isArray(msg)) {
						for (const m of msg) {
							this.mockReceiveMessage(m)
						}
					} else {
						this.mockReceiveMessage(msg)
					}
				}
			}, 1)
		}
	}
	mockReceiveMessage(msg: string | Buffer) {
		this.emit('data', msg)
	}
	mockAddReply(cb: string | string[] | false | ((data: any) => string | string[] | Buffer | Buffer[] | false)) {
		this._responses.push(cb)
	}
	mockClear() {
		this._responses.splice(0, 9999)
		// @ts-ignore
		this.mockSentMessage0['mockClear']()
		// @ts-ignore
		this.mockSentMessage['mockClear']()
	}
	mockWaitForSentMessages(): Promise<void> {
		return new Promise<void>((resolve) => {
			let check = () => {
				if (this._responses.length === 0) {
					resolve()
				} else {
					setTimeoutOrg(() => {
						check()
					}, 1)
				}
			}
			check()
		})
	}

	decode(data: Buffer): string {
		return iconv.decode(data, 'utf16-be')
	}
	encode(str: string) {
		return iconv.encode(str, 'utf16-be')
	}
	setReplyToHeartBeat(replyToHeartBeat: boolean) {
		this._replyToHeartBeat = replyToHeartBeat
	}
}

export type ISocketMock = jest.Mocked<SocketMock>
