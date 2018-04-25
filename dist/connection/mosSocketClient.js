"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const net_1 = require("net");
const socketConnection_1 = require("./socketConnection");
const parser = require("xml2json");
const iconv = require('iconv-lite');
class MosSocketClient extends events_1.EventEmitter {
    /** */
    constructor(host, port, description, debug) {
        super();
        this._autoReconnect = true;
        this._reconnectDelay = 3000;
        this._reconnectAttempts = 0;
        this._debug = false;
        this._shouldBeConnected = false;
        this._reconnectAttempt = 0;
        this._commandTimeout = 10000;
        this._queueCallback = {};
        this._queueMessages = [];
        this._ready = false;
        this._host = host;
        this._port = port;
        this._description = description;
        if (debug)
            this._debug = debug;
    }
    /** */
    set autoReconnect(autoReconnect) {
        this._autoReconnect = autoReconnect;
    }
    /** */
    set autoReconnectInterval(autoReconnectInterval) {
        this._reconnectDelay = autoReconnectInterval;
    }
    /** */
    set autoReconnectAttempts(autoReconnectAttempts) {
        this._reconnectAttempts = autoReconnectAttempts;
    }
    /** */
    connect() {
        // prevent manipulation of active socket
        if (!this.connected) {
            // throttling attempts
            if (!this._lastConnectionAttempt || (Date.now() - this._lastConnectionAttempt) >= this._reconnectDelay) {
                // recreate client if new attempt:
                if (this._client && this._client.connecting) {
                    this._client.destroy();
                    this._client.removeAllListeners();
                    delete this._client;
                }
                // (re)create client, either on first run or new attempt:
                if (!this._client) {
                    this._client = new net_1.Socket();
                    this._client.on('close', (hadError) => this._onClose(hadError));
                    this._client.on('connect', () => this._onConnected());
                    this._client.on('data', (data) => this._onData(data));
                    this._client.on('error', this._onError);
                }
                // connect:
                if (this._debug)
                    console.log(new Date(), `Socket ${this._description} attempting connection`);
                if (this._debug)
                    console.log('port', this._port, 'host', this._host);
                this._client.connect(this._port, this._host);
                this._shouldBeConnected = true;
                this._lastConnectionAttempt = Date.now();
            }
            // set timer to retry when needed:
            if (!this._connectionAttemptTimer) {
                this._connectionAttemptTimer = global.setInterval(this._autoReconnectionAttempt, this._reconnectDelay);
            }
            this._ready = true;
        }
    }
    /** */
    disconnect() {
        this.dispose();
    }
    queueCommand(message, cb) {
        message.prepare();
        // console.log('queueing', message.messageID, message.constructor.name )
        this._queueCallback[message.messageID] = cb;
        this._queueMessages.push(message);
        this.processQueue();
    }
    processQueue() {
        if (this._ready) {
            if (this.processQueueInterval)
                clearInterval(this.processQueueInterval);
            if (this._queueMessages.length) {
                this._ready = false;
                let message = this._queueMessages[0];
                this.executeCommand(message);
            }
        }
        else {
            clearInterval(this.processQueueInterval);
            this.processQueueInterval = setInterval(() => {
                this.processQueue();
            }, 200);
        }
    }
    /** */
    get host() {
        if (this._client) {
            return this._host;
        }
        return this._host;
    }
    /** */
    get port() {
        if (this._client) {
            return this._port;
        }
        return this._port;
    }
    /** */
    dispose() {
        this._ready = false;
        this._shouldBeConnected = false;
        this._clearConnectionAttemptTimer();
        if (this._client) {
            this._client.once('close', () => { this.emit(socketConnection_1.SocketConnectionEvent.DISPOSED); });
            this._client.end();
            this._client.destroy();
            delete this._client;
        }
    }
    /**
     * convenience wrapper to expose all logging calls to parent object
     */
    log(args) {
        if (this._debug)
            console.log(args);
    }
    /** */
    set connected(connected) {
        this._connected = connected === true;
        this.emit(socketConnection_1.SocketConnectionEvent.CONNECTED);
    }
    /** */
    get connected() {
        return this._connected;
    }
    /** */
    executeCommand(message) {
        // message.prepare() // @todo, is prepared? is sent already? logic needed
        let str = message.toString();
        let buf = iconv.encode(str, 'utf16-be');
        // console.log('sending',this._client.name, str)
        global.clearTimeout(this._commandTimeoutTimer);
        this._commandTimeoutTimer = global.setTimeout(() => this._onCommandTimeout(), this._commandTimeout);
        this._client.write(buf, 'ucs2');
        if (this._debug)
            console.log(`MOS command sent from ${this._description} : ${str}\r\nbytes sent: ${this._client.bytesWritten}`);
    }
    /** */
    _autoReconnectionAttempt() {
        if (this._autoReconnect) {
            if (this._reconnectAttempts > 0) {
                if ((this._reconnectAttempt >= this._reconnectAttempts)) {
                    // reset reconnection behaviour
                    this._clearConnectionAttemptTimer();
                    return;
                }
                // new attempt if not allready connected
                if (!this.connected) {
                    this._reconnectAttempt++;
                    this.connect();
                }
            }
        }
    }
    /** */
    _clearConnectionAttemptTimer() {
        // @todo create event telling reconnection ended with result: true/false
        // only if reconnection interval is true
        this._reconnectAttempt = 0;
        global.clearInterval(this._connectionAttemptTimer);
        delete this._connectionAttemptTimer;
    }
    /** */
    _onCommandTimeout() {
        global.clearTimeout(this._commandTimeoutTimer);
        this.emit(socketConnection_1.SocketConnectionEvent.TIMEOUT);
    }
    /** */
    _onConnected() {
        this._client.emit(socketConnection_1.SocketConnectionEvent.ALIVE);
        global.clearInterval(this._connectionAttemptTimer);
        // this._clearConnectionAttemptTimer()
        this.connected = true;
    }
    /** */
    _onData(data) {
        this._client.emit(socketConnection_1.SocketConnectionEvent.ALIVE);
        // data = Buffer.from(data, 'ucs2').toString()
        let str = iconv.decode(data, 'utf16-be');
        if (this._debug)
            console.log(`${this._description} Received: ${str}`);
        try {
            let parsedData = parser.toJson(str, {
                'object': true,
                coerce: true,
                trim: true
            });
            let messageId = parsedData.mos.messageID;
            let cb = this._queueCallback[messageId];
            let msg = this._queueMessages[0];
            if (msg.messageID.toString() !== (messageId + '')) {
                console.log('Mos reply id diff: ' + messageId + ', ' + msg.messageID);
            }
            if (cb) {
                cb(null, parsedData);
                this._queueMessages.shift(); // remove the first message
                delete this._queueCallback[messageId];
            }
        }
        catch (e) {
            console.log('str', str);
            throw e;
        }
        this._ready = true;
        this.processQueue();
    }
    /** */
    _onError(error) {
        // dispatch error!!!!!
        if (this._debug)
            console.log(`Socket event error: ${error.message}`);
    }
    /** */
    _onClose(hadError) {
        this.connected = false;
        this._ready = false;
        if (hadError) {
            if (this._debug)
                console.log('Socket closed with error');
        }
        else {
            if (this._debug)
                console.log('Socket closed without error');
        }
        this.emit(socketConnection_1.SocketConnectionEvent.DISCONNECTED);
        if (this._shouldBeConnected === true) {
            if (this._debug)
                console.log('Socket should reconnect');
            this.connect();
        }
    }
}
exports.MosSocketClient = MosSocketClient;
//# sourceMappingURL=mosSocketClient.js.map