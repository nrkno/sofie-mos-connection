import { Socket } from 'net'
import * as EventEmitter from 'events'
import { SocketType } from './socketType'
import { SocketConnectionStatus } from './mosSocketEvents'

export default class MosSocketClient extends EventEmitter {
	private _host: string
	private _port: number
	private _autoReconnect: boolean = true
	private _reconnectDelay: number = 3000
	private _reconnectAttempts: number = 0

	private _description: string
	private _client: Socket
	private _shouldBeConnected: boolean = false
	private _connectedStatus: boolean
	private _lastConnectionAttempt: number
	private _reconnectAttempt: number = 0
	private _connectionAttemptTimer: NodeJS.Timer

	private _commandTimeoutTimer: NodeJS.Timer
	private _commandTimeout: number = 10000

	/** */
	constructor (host: string, port: number, description: SocketType) {
		super()
		this._host = host
		this._port = port
		this._description = description
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
		// prevents manipulation of active socket
		if (!this._connected) {
			// throthling attempts
			if (!this._lastConnectionAttempt || (Date.now() - this._lastConnectionAttempt) >= this._reconnectDelay) { // !_lastReconnectionAttempt (means first attempt) OR time > _reconnectionDelay since last attempt
				// recereates client if new attempt
				if (this._client && this._client.connecting) {
					this._client.destroy()
					this._client.removeAllListeners()
					delete this._client
				}

				// (re)creates client, either on first run or new attempt
				if (!this._client) {
					this._client = new Socket()
					this._client.on('close', (hadError: boolean) => this._onClose(hadError))
					this._client.on('connect', () => this._onConnected())
					this._client.on('data', (data: Buffer) => this._onData(data))
					this._client.on('error', (error: Error) => this._onError(error))
				}

				// connects
				this.log(`Socket ${this._description} attempting connection`)
				this._client.connect(this._port, this._host)
				this._shouldBeConnected = true
				this._lastConnectionAttempt = Date.now()
			}

			// sets timer to retry when needed
			if (!this._connectionAttemptTimer) {
				this._connectionAttemptTimer = global.setInterval(() => this._autoReconnectionAttempt(), this._reconnectDelay)
			}
		}
	}

	/** */
	disconnect (): void {
		this.dispose()
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
		this._shouldBeConnected = false
		this._clearConnectionAttemptTimer()
		if (this._client) {
			this._client.once('close', () => { this.emit(SocketConnectionStatus.DESTROYED) })
			this._client.end()
			this._client.destroy()
			delete this._client
		}
	}

	/**
	 * convenience wrapper to expose all logging calls to parent object
	 */
	log (args: any): void {
		console.log(args)
	}

	/** */
	private set _connected (connected: boolean) {
		this._connectedStatus = connected === true
		this.emit(SocketConnectionStatus.CONNECTED)
	}

	/** */
	private get _connected (): boolean {
		return this._connectedStatus
	}

	/** */
	executeCommand (): void {
		let commandString: string = ''

		global.clearTimeout(this._commandTimeoutTimer)
		this._commandTimeoutTimer = global.setTimeout(() => this._onCommandTimeout(), this._commandTimeout)
		this._client.write(commandString)

		this.log(`MOS command sent from ${this._description} : ${commandString}`)
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
				if (!this._connected) {
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
		this.emit(SocketConnectionStatus.TIMEOUT)
	}

	/** */
	private _onConnected () {
		this._clearConnectionAttemptTimer()
		this._connected = true
	}

	/** */
	private _onData (data: Buffer) {
		console.log(`Data received: ${data}`)
	}

	/** */
	private _onError (error: Error) {
		// dispatch error!!!!!
		this.log(`Socket event error: ${error.message}`)
	}

	/** */
	private _onClose (hadError: boolean) {
		this._connected = false
		if (hadError) {
			this.log('Socket closed with error')
		} else {
			this.log('Socket closed without error')
		}

		this.emit(SocketConnectionStatus.DISCONNECTED)

		if (this._shouldBeConnected === true) {
			this.log('Socket should reconnect')
			this.connect()
		}
	}
}
