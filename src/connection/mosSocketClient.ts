import { EventEmitter } from 'events'
import { Socket } from 'net'
import { SocketConnectionEvent } from './socketConnection'
import { MosMessage } from '../mosModel/MosMessage'
import { xml2js } from '../utils/Utils'
import { HandedOverQueue } from './NCSServerConnection'
const iconv = require('iconv-lite')

export type CallBackFunction = (err: any, data: object) => void

export interface QueueMessage {
	time: number
	msg: MosMessage
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
	private _connected: boolean = false
	private _lastConnectionAttempt: number
	private _reconnectAttempt: number = 0
	private _connectionAttemptTimer: NodeJS.Timer

	private _commandTimeoutTimer: NodeJS.Timer
	private _commandTimeout: number

	private _queueCallback: {[messageId: string]: CallBackFunction} = {}
	private _queueMessages: Array<QueueMessage> = []

	private _sentMessage: QueueMessage | null = null
	// private _readyToSendMessage: boolean = true

	private processQueueTimeout: NodeJS.Timer
	private _startingUp: boolean = true
	private dataChunks: string = ''

  /** */
	constructor (host: string, port: number, description: string, timeout?: number, debug?: boolean) {
		super()
		this._host = host
		this._port = port
		this._description = description
		this._commandTimeout = timeout || 5000
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
				this._connectionAttemptTimer = global.setInterval(() => {
					this._autoReconnectionAttempt()
				}, this._reconnectDelay)
			}

			// this._readyToSendMessage = true
			// this._sentMessage = null
		}
	}

  /** */
	disconnect (): void {
		this.dispose()
	}

	queueCommand (message: MosMessage, cb: CallBackFunction, time?: number): void {

		message.prepare()
		// console.log('queueing', message.messageID, message.constructor.name )
		this._queueCallback[message.messageID + ''] = cb
		this._queueMessages.push({ time: time || Date.now(), msg: message })

		this.processQueue()
	}
	processQueue () {
		// console.log('this.connected', this.connected)
		if (!this._sentMessage && this.connected) {
			if (this.processQueueTimeout) clearTimeout(this.processQueueTimeout)
			let message = this._queueMessages.shift()
			if (message) {
				// Send the message:
				this.executeCommand(message)
			} else {
				// The queue is empty, do nothing
			}
		} else {
			if (!this._sentMessage && this._queueMessages.length > 0) {
				if (Date.now() - this._queueMessages[0].time > this._commandTimeout) {
					const msg = this._queueMessages.shift()!
					this._queueCallback[msg.msg.messageID]('Command timed out', {})
					delete this._queueCallback[msg.msg.messageID]
					this.processQueue()
				} else {
					// Try again later:
					clearTimeout(this.processQueueTimeout)
					this.processQueueTimeout = setTimeout(() => {
						this.processQueue()
					}, 200)
				}
			}
		}
	}
	handOverQueue (): HandedOverQueue {
		const queue = {
			messages: this._queueMessages,
			callbacks: this._queueCallback
		}
		this._queueMessages = []
		this._queueCallback = {}
		this._sentMessage = null
		clearTimeout(this.processQueueTimeout)
		return queue
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
		// this._readyToSendMessage = false
		this.connected = false
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
	public setDebug (debug: boolean) {
		this._debug = debug
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

	private _sendReply (messageId: number, err: any, res: any) {
		let cb: CallBackFunction | undefined = this._queueCallback[messageId + '']
		if (cb) {
			cb(err, res)
		} else {
			// this._onUnhandledCommandTimeout()
			this.emit('error', `Error: No callback found for messageId ${messageId}`)
		}
		this._sentMessage = null
		delete this._queueCallback[messageId + '']
	}

  /** */
	private executeCommand (message: QueueMessage, isRetry?: boolean): void {
		if (this._sentMessage) throw Error('executeCommand: there already is a sent Command!')

		this._sentMessage = message

		let sentMessageId = message.msg.messageID

		// console.log('executeCommand', message)
		// message.prepare() // @todo, is prepared? is sent already? logic needed
		let messageString: string = message.msg.toString()
		let buf = iconv.encode(messageString, 'utf16-be')
		// if (this._debug) console.log('sending',this._client.name, str)

		// Command timeout:
		global.setTimeout(() => {
			if (this._sentMessage && this._sentMessage.msg.messageID === sentMessageId) {
				if (this._debug) console.log('timeout ' + sentMessageId + ' after ' + this._commandTimeout)
				if (isRetry) {
					this._sendReply(sentMessageId, Error('Command timed out'), null)
					this.processQueue()
				} else {
					this._sentMessage = null
					this.executeCommand(message, true)
				}
			}
		}, this._commandTimeout)
		this._client.write(buf, 'ucs2')
		if (this._debug) console.log(`MOS command sent from ${this._description} : ${messageString}\r\nbytes sent: ${this._client.bytesWritten}`)

		this.emit('rawMessage','sent', messageString)
	}

  /** */
	private _autoReconnectionAttempt (): void {
		if (this._autoReconnect) {
			if (this._reconnectAttempts > -1) {								// no reconnection if no valid reconnectionAttemps is set
				if (this._reconnectAttempts > 0 && (this._reconnectAttempt >= this._reconnectAttempts)) {	// if current attempt is not less than max attempts
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
	// private _onUnhandledCommandTimeout () {
	// 	global.clearTimeout(this._commandTimeoutTimer)
	// 	this.emit(SocketConnectionEvent.TIMEOUT)
	// }

  /** */
	private _onConnected () {
		this._client.emit(SocketConnectionEvent.ALIVE)
		// global.clearInterval(this._connectionAttemptTimer)
		this._clearConnectionAttemptTimer()
		this.connected = true
	}

  /** */
	private _onData (data: Buffer) {
		this._client.emit(SocketConnectionEvent.ALIVE)
		// data = Buffer.from(data, 'ucs2').toString()
		let messageString: string = iconv.decode(data, 'utf16-be').trim()

		this.emit('rawMessage','recieved', messageString)
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
				parsedData = xml2js(messageString)// , { compact: true, trim: true, nativeType: true })
				this.dataChunks = ''
			} else if (last === lastMatch) {
				// Last chunk, ready to parse with saved data:
				parsedData = xml2js(this.dataChunks + messageString)// , { compact: true, trim: true, nativeType: true })
				this.dataChunks = ''
			} else if (first === firstMatch) {
				// Chunk, save for later:
				this.dataChunks = messageString
			} else {
				// Chunk, save for later:
				this.dataChunks += messageString
			}
			// let parsedData: any = parser.toJson(messageString, )
			if (parsedData) {
				// console.log(parsedData, newParserData)
				let messageId = parsedData.mos.messageID
				if (messageId) {
					if (this._sentMessage) {
						if (this._sentMessage.msg.messageID.toString() === (messageId + '')) {
							this._sendReply(this._sentMessage.msg.messageID, null, parsedData)
						} else {
							if (this._debug) console.log('Mos reply id diff: ' + messageId + ', ' + this._sentMessage.msg.messageID)
							if (this._debug) console.log(parsedData)

							this.emit('warning', 'Mos reply id diff: ' + messageId + ', ' + this._sentMessage.msg.messageID)

							this._triggerQueueCleanup()
						}
						// let cb: CallBackFunction | undefined = this._queueCallback[messageId]
						// if (cb) {
						// 	cb(null, parsedData)
						// }
						// delete this._queueCallback[messageId]
						// this._sentMessage = null
					} else {
						// huh, we've got a reply to something we've not sent.
						if (this._debug) console.log('Got a reply (' + messageId + '), but we haven\'t sent any message', messageString)
						this.emit('warning', 'Got a reply (' + messageId + '), but we haven\'t sent any message ' + messageString)
					}
					clearTimeout(this._commandTimeoutTimer)
				} else {
					// error message?
					if (parsedData.mos.mosAck && parsedData.mos.mosAck.status === 'NACK') {
						if (this._sentMessage && parsedData.mos.mosAck.statusDescription === 'Buddy server cannot respond because main server is available') {
							this._sendReply(this._sentMessage.msg.messageID, 'Main server available', parsedData)
						} else {
							if (this._debug) console.log('Mos Error message:' + parsedData.mos.mosAck.statusDescription)
							this.emit('error', 'Error message: ' + parsedData.mos.mosAck.statusDescription)
						}
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
			// console.log('messageString', messageString)
			if (this._startingUp) {
				// when starting up, we might get half a message, let's ignore this error then
				let a = Math.min(20, Math.floor(messageString.length / 2))
				console.log('Strange XML-message upon startup: "' + messageString.slice(0, a) + '[...]' + messageString.slice(-a) + '" (length: ' + messageString.length + ')')
				console.log('error', e)
			} else {
				console.log('dataChunks-------------\n', this.dataChunks)
				console.log('messageString---------\n', messageString)
				this.emit('error', e)
			}
		}

		// this._readyToSendMessage = true
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
		// this._readyToSendMessage = false
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
	private _triggerQueueCleanup () {
		// in case we're in unsync with messages, prevent deadlock:
		setTimeout(() => {
			if (this._debug) console.log('QueueCleanup')
			for (let i = this._queueMessages.length - 1; i >= 0; i--) {
				let message = this._queueMessages[i]
				if (Date.now() - message.time > this._commandTimeout) {

					this._sendReply(message.msg.messageID, Error('Command Timeout'), null)
					this._queueMessages.splice(i, 1)
				}
			}

		}, this._commandTimeout)
	}
}
