import { EventEmitter } from 'events'
import { Socket } from 'net'
import { SocketConnectionEvent } from './socketConnection'
import { MosMessage } from '../mosModel/MosMessage'
import * as parser from 'xml2json'
const iconv = require('iconv-lite')

export type CallBackFunction = (err: any, data: object) => void

const parseOptions: any = {
	'object': true,
	coerce: true,
	trim: true
}

export class MosSocketClient extends EventEmitter {
	private _host: string
	private _port: number
	private _autoReconnect: boolean = true
	private _reconnectDelay: number = 3000
	private _reconnectAttempts: number = 0
	private _debug: boolean = false

	private _description: string
	private _client: Socket
	private _shouldBeConnected: boolean = false
	private _connected: boolean
	private _lastConnectionAttempt: number
	private _reconnectAttempt: number = 0
	private _connectionAttemptTimer: NodeJS.Timer

	private _commandTimeoutTimer: NodeJS.Timer
	private _commandTimeout: number = 10000

	private _queueCallback: {[messageId: string]: CallBackFunction} = {}
	private _queueMessages: Array<MosMessage> = []
	private _ready: boolean = false

	private processQueueInterval: any
	private _startingUp: boolean = true
	private dataChunks: string = ''
  /** */
	constructor (host: string, port: number, description: string, debug?: boolean) {
		super()
		this._host = host
		this._port = port
		this._description = description
		if (debug) this._debug = debug

	}

  /** */
	set autoReconnect (autoReconnect: boolean) {
		this._autoReconnect = autoReconnect
	}

  /** */
	set autoReconnectInterval (autoReconnectInterval: number) {
		this._reconnectDelay = autoReconnectInterval
	}

  /** */
	set autoReconnectAttempts (autoReconnectAttempts: number) {
		this._reconnectAttempts = autoReconnectAttempts
	}

  /** */
	connect (): void {
		// prevent manipulation of active socket
		if (!this.connected) {
			// throttling attempts
			if (!this._lastConnectionAttempt || (Date.now() - this._lastConnectionAttempt) >= this._reconnectDelay) { // !_lastReconnectionAttempt (means first attempt) OR time > _reconnectionDelay since last attempt
				// recreate client if new attempt:
				if (this._client && this._client.connecting) {
					this._client.destroy()
					this._client.removeAllListeners()
					delete this._client
				}

				// (re)create client, either on first run or new attempt:
				if (!this._client) {
					this._client = new Socket()
					this._client.on('close', (hadError: boolean) => this._onClose(hadError))
					this._client.on('connect', () => this._onConnected())
					this._client.on('data', (data: Buffer) => this._onData(data))
					this._client.on('error', this._onError)
				}

				// connect:
				if (this._debug) console.log(new Date(), `Socket ${this._description} attempting connection`)
				if (this._debug) console.log('port', this._port, 'host', this._host)
				this._client.connect(this._port, this._host)
				this._shouldBeConnected = true
				this._lastConnectionAttempt = Date.now()
			}

			// set timer to retry when needed:
			if (!this._connectionAttemptTimer) {
				this._connectionAttemptTimer = global.setInterval(this._autoReconnectionAttempt, this._reconnectDelay)
			}

			this._ready = true
		}
	}

  /** */
	disconnect (): void {
		this.dispose()
	}

	queueCommand (message: MosMessage, cb: CallBackFunction): void {

		message.prepare()
		// console.log('queueing', message.messageID, message.constructor.name )
		this._queueCallback[message.messageID] = cb
		this._queueMessages.push(message)

		this.processQueue()
	}
	processQueue () {
		if (this._ready) {
			if (this.processQueueInterval) clearInterval(this.processQueueInterval)
			if (this._queueMessages.length) {
				this._ready = false
				let message = this._queueMessages[0]
				this.executeCommand(message)
			}
		} else {
			clearInterval(this.processQueueInterval)
			this.processQueueInterval = setInterval(() => {
				this.processQueue()
			}, 200)
		}
	}

  /** */
	get host (): string {
		if (this._client) {
			return this._host
		}
		return this._host
	}

  /** */
	get port (): number {
		if (this._client) {
			return this._port
		}
		return this._port
	}

  /** */
	dispose (): void {
		this._ready = false
		this._shouldBeConnected = false
		this._clearConnectionAttemptTimer()
		if (this._client) {
			this._client.once('close', () => { this.emit(SocketConnectionEvent.DISPOSED) })
			this._client.end()
			this._client.destroy()
			delete this._client
		}
	}

  /**
   * convenience wrapper to expose all logging calls to parent object
   */
	log (args: any): void {
		if (this._debug) console.log(args)
	}

  /** */
	private set connected (connected: boolean) {
		this._connected = connected === true
		this.emit(SocketConnectionEvent.CONNECTED)
	}

  /** */
	private get connected (): boolean {
		return this._connected
	}

  /** */
	private executeCommand (message: MosMessage): void {

		// message.prepare() // @todo, is prepared? is sent already? logic needed
		let str: string = message.toString()
		let buf = iconv.encode(str, 'utf16-be')

		// console.log('sending',this._client.name, str)

		global.clearTimeout(this._commandTimeoutTimer)
		this._commandTimeoutTimer = global.setTimeout(() => this._onCommandTimeout(), this._commandTimeout)
		this._client.write(buf, 'ucs2')
		if (this._debug) console.log(`MOS command sent from ${this._description} : ${str}\r\nbytes sent: ${this._client.bytesWritten}`)

	}

  /** */
	private _autoReconnectionAttempt (): void {
		if (this._autoReconnect) {
			if (this._reconnectAttempts > 0) {								// no reconnection if no valid reconnectionAttemps is set
				if ((this._reconnectAttempt >= this._reconnectAttempts)) {	// if current attempt is not less than max attempts
					// reset reconnection behaviour
					this._clearConnectionAttemptTimer()
					return
				}
				// new attempt if not allready connected
				if (!this.connected) {
					this._reconnectAttempt++
					this.connect()
				}
			}
		}
	}

	/** */
	private _clearConnectionAttemptTimer (): void {
		// @todo create event telling reconnection ended with result: true/false
		// only if reconnection interval is true
		this._reconnectAttempt = 0
		global.clearInterval(this._connectionAttemptTimer)
		delete this._connectionAttemptTimer
	}

  /** */
	private _onCommandTimeout () {
		global.clearTimeout(this._commandTimeoutTimer)
		this.emit(SocketConnectionEvent.TIMEOUT)
	}

  /** */
	private _onConnected () {
		this._client.emit(SocketConnectionEvent.ALIVE)
		global.clearInterval(this._connectionAttemptTimer)
		// this._clearConnectionAttemptTimer()
		this.connected = true
	}

  /** */
	private _onData (data: Buffer ) {
		this._client.emit(SocketConnectionEvent.ALIVE)
		// data = Buffer.from(data, 'ucs2').toString()
		let messageString: string = iconv.decode(data, 'utf16-be').trim()

		if (this._debug) console.log(`${this._description} Received: ${messageString}`)

		let firstMatch = '<mos>' // <mos>
		let first = messageString.substr(0, firstMatch.length)
		let lastMatch = '</mos>' // </mos>
		let last = messageString.substr(-lastMatch.length)

		let parsedData: any
		try {
			// console.log(first === firstMatch, last === lastMatch, last, lastMatch)
			if (first === firstMatch && last === lastMatch) {
				// Data ready to be parsed:
				parsedData = parser.toJson(messageString, parseOptions)
				this.dataChunks = ''
			} else if (last === lastMatch) {
				// Last chunk, ready to parse with saved data:
				parsedData = parser.toJson(this.dataChunks + messageString, parseOptions)
				this.dataChunks = ''
			} else if (first === firstMatch ) {
				// Chunk, save for later:
				this.dataChunks = messageString
			} else {
				// Chunk, save for later:
				this.dataChunks += messageString
			}
			// let parsedData: any = parser.toJson(messageString, )
			if (parsedData) {
				let messageId = parsedData.mos.messageID
				if (messageId) {
					let cb: CallBackFunction | undefined = this._queueCallback[messageId]
					let msg = this._queueMessages[0]
					if (msg) {
						if (msg.messageID.toString() !== (messageId + '')) {
							console.log('Mos reply id diff: ' + messageId + ', ' + msg.messageID)
							console.log(parsedData)
						}
						if (cb) {
							cb(null, parsedData)
							this._queueMessages.shift() // remove the first message
							delete this._queueCallback[messageId]
						}
					} else {
						// huh, we've got a reply to something we've not sent.
						console.log('Got reply to something we\'ve not asked for', messageString)
					}
				} else {
					// error message?
					if (parsedData.mos.mosAck && parsedData.mos.mosAck.status === 'NACK') {
						console.log('Mos Error message:' + parsedData.mos.mosAck.statusDescription)
						this.emit('error', 'Error message: ' + parsedData.mos.mosAck.statusDescription)
					} else {
						// unknown message..
						this.emit('error', 'Unknown message: ' + messageString)
					}
				}
			} else {
				return
			}
			// console.log('messageString', messageString)
			// console.log('first msg', messageString)
			this._startingUp = false
		} catch (e) {
			console.log('messageString', messageString)
			if (this._startingUp) {
				// when starting up, we might get half a message, let's ignore this error then
				console.log('Strange XML-message upon startup')
			} else {
				console.log('dataChunks-------------\n', this.dataChunks)
				console.log('messageString---------\n', messageString)
				this.emit('error', e)
			}
		}

		this._ready = true
		this.processQueue()
	}

  /** */
	private _onError (error: Error) {
		// dispatch error!!!!!
		if (this._debug) console.log(`Socket event error: ${error.message}`)
	}

	/** */
	private _onClose (hadError: boolean) {
		this.connected = false
		this._ready = false
		if (hadError) {
			if (this._debug) console.log('Socket closed with error')
		} else {
			if (this._debug) console.log('Socket closed without error')
		}

		this.emit(SocketConnectionEvent.DISCONNECTED)

		if (this._shouldBeConnected === true) {
			if (this._debug) console.log('Socket should reconnect')
			this.connect()
		}
	}
}
