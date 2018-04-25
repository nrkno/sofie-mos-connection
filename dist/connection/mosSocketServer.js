"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = require("net");
const events_1 = require("events");
const socketConnection_1 = require("./socketConnection");
class MosSocketServer extends events_1.EventEmitter {
    /** */
    constructor(port, description, debug) {
        super();
        this._debug = false;
        this._port = port;
        this._portDescription = description;
        if (debug)
            this._debug = debug;
        this._socketServer = new net_1.Server();
        this._socketServer.on('connection', (socket) => this._onClientConnection(socket));
        this._socketServer.on('close', () => this._onServerClose());
        this._socketServer.on('error', (error) => this._onServerError(error));
    }
    dispose(sockets) {
        return new Promise((resolveDispose) => {
            let closePromises = [];
            // close clients
            sockets.forEach(socket => {
                closePromises.push(new Promise((resolve) => {
                    socket.on('close', resolve);
                    socket.end();
                    socket.destroy();
                }));
            });
            // close server
            closePromises.push(new Promise((resolve) => {
                this._socketServer.on('close', resolve);
                this._socketServer.close();
            }));
            Promise.all(closePromises).then(() => resolveDispose());
        });
    }
    /** */
    listen() {
        if (this._debug)
            console.log('listen', this._portDescription, this._port);
        return new Promise((resolve, reject) => {
            if (this._debug)
                console.log('inside promise', this._portDescription, this._port);
            // already listening
            if (this._socketServer.listening) {
                if (this._debug)
                    console.log('already listening', this._portDescription, this._port);
                resolve(true);
                return;
            }
            // handles listening-listeners and cleans up
            let handleListeningStatus = (e) => {
                if (this._debug)
                    console.log('handleListeningStatus');
                this._socketServer.removeListener('listening', handleListeningStatus);
                this._socketServer.removeListener('close', handleListeningStatus);
                this._socketServer.removeListener('error', handleListeningStatus);
                if (this._socketServer.listening) {
                    if (this._debug)
                        console.log('listening', this._portDescription, this._port);
                    resolve(true);
                }
                else {
                    if (this._debug)
                        console.log('not listening', this._portDescription, this._port);
                    reject(e || false);
                }
            };
            // listens and handles error and events
            this._socketServer.on('listening', () => {
                if (this._debug)
                    console.log('listening!!');
            });
            this._socketServer.once('listening', handleListeningStatus);
            this._socketServer.once('close', handleListeningStatus);
            this._socketServer.once('error', handleListeningStatus);
            this._socketServer.listen(this._port);
        });
    }
    /** */
    _onClientConnection(socket) {
        this.emit(socketConnection_1.SocketServerEvent.CLIENT_CONNECTED, {
            socket: socket,
            portDescription: this._portDescription
        });
    }
    /** */
    _onServerError(error) {
        // @todo: implement
        if (this._debug)
            console.log('Server error:', error);
    }
    /** */
    _onServerClose() {
        // @todo: implement
        if (this._debug)
            console.log(`Server closed: on port ${this._port}`);
    }
}
exports.MosSocketServer = MosSocketServer;
//# sourceMappingURL=mosSocketServer.js.map