"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionConfig_1 = require("./config/connectionConfig");
const mosSocketServer_1 = require("./connection/mosSocketServer");
const api_1 = require("./api");
const MosDevice_1 = require("./MosDevice");
const socketConnection_1 = require("./connection/socketConnection");
const NCSServerConnection_1 = require("./connection/NCSServerConnection");
const parser = require("xml2json");
const MosMessage_1 = require("./mosModel/MosMessage");
const mosAck_1 = require("./mosModel/mosAck");
const mosString128_1 = require("./dataTypes/mosString128");
const events_1 = require("events");
const iconv = require('iconv-lite');
class MosConnection extends events_1.EventEmitter {
    /** */
    constructor(configOptions) {
        super();
        this._debug = false;
        this._incomingSockets = {};
        this._ncsConnections = {};
        this._mosDevices = {};
        this._conf = new connectionConfig_1.ConnectionConfig(configOptions);
        if (this._conf.acceptsConnections) {
            this._isListening = this._initiateIncomingConnections();
        }
        if (this._conf.debug) {
            this._debug = this._conf.debug;
        }
    }
    /** */
    connect(connectionOptions) {
        // @todo: implement this
        return new Promise((resolve) => {
            // connect to mos device
            // Store MosSocketClients instead of Sockets in Server?
            // Create MosSocketClients in construct?
            let primary = new NCSServerConnection_1.NCSServerConnection(connectionOptions.primary.id, connectionOptions.primary.host, this._conf.mosID, connectionOptions.primary.timeout, this._debug);
            let secondary = null;
            this._ncsConnections[connectionOptions.primary.host] = primary;
            primary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_LOWER, 'lower');
            primary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_UPPER, 'upper');
            if (connectionOptions.secondary) {
                secondary = new NCSServerConnection_1.NCSServerConnection(connectionOptions.secondary.id, connectionOptions.secondary.host, this._conf.mosID, connectionOptions.secondary.timeout, this._debug);
                this._ncsConnections[connectionOptions.secondary.host] = secondary;
                secondary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_LOWER, 'lower');
                secondary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_UPPER, 'upper');
            }
            // initialize mosDevice:
            let mosDevice = this.registerMosDevice(this._conf.mosID, connectionOptions.primary.id, (connectionOptions.secondary ? connectionOptions.secondary.id : null), primary, secondary);
            resolve(mosDevice);
        });
    }
    onConnection(cb) {
        this._onconnection = cb;
    }
    registerMosDevice(myMosID, theirMosId0, theirMosId1, primary, secondary) {
        let id0 = myMosID + '_' + theirMosId0;
        let id1 = (theirMosId1 ? myMosID + '_' + theirMosId1 : null);
        let mosDevice = new MosDevice_1.MosDevice(id0, id1, this._conf, primary, secondary);
        this._mosDevices[id0] = mosDevice;
        if (id1)
            this._mosDevices[id1] = mosDevice;
        mosDevice.connect();
        // emit to .onConnection
        if (this._onconnection)
            this._onconnection(mosDevice);
        return mosDevice;
    }
    /** */
    get isListening() {
        return this._isListening || Promise.reject(`Mos connection is not listening for connections. "Config.acceptsConnections" is "${this._conf.acceptsConnections}"`);
    }
    /** */
    get isCompliant() {
        return false;
    }
    /** */
    get acceptsConnections() {
        return this._conf.acceptsConnections;
    }
    /** */
    get profiles() {
        return this._conf.profiles;
    }
    /** */
    dispose() {
        let sockets = [];
        for (let socketID in this._incomingSockets) {
            let e = this._incomingSockets[socketID];
            if (e) {
                sockets.push(e.socket);
            }
        }
        let disposePromises = sockets.map((socket) => {
            return new Promise((resolve) => {
                socket.on('close', resolve);
                socket.end();
                socket.destroy();
            });
        });
        disposePromises.push(this._lowerSocketServer.dispose([]));
        disposePromises.push(this._upperSocketServer.dispose([]));
        disposePromises.push(this._querySocketServer.dispose([]));
        return Promise.all(disposePromises)
            .then(() => {
            return;
        });
    }
    /** */
    get complianceText() {
        if (this.isCompliant) {
            let profiles = [];
            for (let nextSocketID in this._conf.profiles) {
                // @ts-ignore will fix this correctly later
                if (this._conf.profiles[nextSocketID] === true) {
                    profiles.push(nextSocketID);
                }
            }
            return `MOS Compatible – Profiles ${profiles.join(',')}`;
        }
        return 'Warning: Not MOS compatible';
    }
    /** */
    _initiateIncomingConnections() {
        // console.log('_initiateIncomingConnections')
        // shouldn't accept connections, so won't rig socket servers
        if (!this._conf.acceptsConnections) {
            // console.log('reject')
            return Promise.reject(false);
        }
        // setup two socket servers, then resolve with their listening statuses
        this._lowerSocketServer = new mosSocketServer_1.MosSocketServer(MosConnection.CONNECTION_PORT_LOWER, 'lower');
        this._upperSocketServer = new mosSocketServer_1.MosSocketServer(MosConnection.CONNECTION_PORT_UPPER, 'upper');
        this._querySocketServer = new mosSocketServer_1.MosSocketServer(MosConnection.CONNECTION_PORT_QUERY, 'query');
        this._lowerSocketServer.on(socketConnection_1.SocketServerEvent.CLIENT_CONNECTED, (e) => this._registerIncomingClient(e));
        this._upperSocketServer.on(socketConnection_1.SocketServerEvent.CLIENT_CONNECTED, (e) => this._registerIncomingClient(e));
        this._querySocketServer.on(socketConnection_1.SocketServerEvent.CLIENT_CONNECTED, (e) => this._registerIncomingClient(e));
        // console.log('listen on all ports')
        return Promise.all([
            this._lowerSocketServer.listen(),
            this._upperSocketServer.listen(),
            this._querySocketServer.listen()
        ]);
    }
    /** */
    _registerIncomingClient(client) {
        let socketID = MosConnection.nextSocketID;
        // console.log('_registerIncomingClient', socketID, e.socket.remoteAddress)
        // handles socket listeners
        client.socket.on('close', () => {
            this._disposeIncomingSocket(socketID);
        }); // => this._disposeIncomingSocket(e.socket, socketID))
        client.socket.on('end', () => {
            if (this._debug)
                console.log('Socket End');
        });
        client.socket.on('drain', () => {
            if (this._debug)
                console.log('Socket Drain');
        });
        client.socket.on('data', (data) => {
            let messageString = iconv.decode(data, 'utf16-be').trim();
            if (this._debug)
                console.log(`Socket got data (${socketID}, ${client.socket.remoteAddress}, ${client.portDescription}): ${data}`);
            let parsed = null;
            let parseOptions = {
                object: true,
                coerce: true,
                trim: true
            };
            let firstMatch = '<mos>'; // <mos>
            let first = messageString.substr(0, firstMatch.length);
            let lastMatch = '</mos>'; // </mos>
            let last = messageString.substr(-lastMatch.length);
            if (!client.chunks)
                client.chunks = '';
            try {
                // console.log('--------------------------------------------------------')
                // console.log(messageString)
                if (first === firstMatch && last === lastMatch) {
                    // Data ready to be parsed:
                    // @ts-ignore xml2json says arguments are wrong, but its not.
                    parsed = parser.toJson(messageString, parseOptions);
                }
                else if (last === lastMatch) {
                    // Last chunk, ready to parse with saved data:
                    // @ts-ignore xml2json says arguments are wrong, but its not.
                    parsed = parser.toJson(client.chunks + messageString, parseOptions);
                    client.chunks = '';
                }
                else if (first === firstMatch) {
                    // Chunk, save for later:
                    client.chunks = messageString;
                }
                else {
                    // Chunk, save for later:
                    client.chunks += messageString;
                }
                if (parsed !== null) {
                    let mosDevice = (this._mosDevices[parsed.mos.ncsID + '_' + parsed.mos.mosID] ||
                        this._mosDevices[parsed.mos.mosID + '_' + parsed.mos.ncsID]);
                    let mosMessageId = parsed.mos.messageID; // is this correct? (needs to be verified) /Johan
                    let ncsID = parsed.mos.ncsID;
                    let mosID = parsed.mos.mosID;
                    let sendReply = (message) => {
                        message.ncsID = ncsID;
                        message.mosID = mosID;
                        message.prepare(mosMessageId);
                        let msgStr = message.toString();
                        let buf = iconv.encode(msgStr, 'utf16-be');
                        client.socket.write(buf, 'usc2');
                    };
                    if (!mosDevice && this._conf.openRelay) {
                        // console.log('OPEN RELAY ------------------')
                        // Register a new mosDevice to use for this connection
                        if (parsed.mos.ncsID === this._conf.mosID) {
                            mosDevice = this.registerMosDevice(this._conf.mosID, parsed.mos.mosID, null, null, null);
                        }
                        else if (parsed.mos.mosID === this._conf.mosID) {
                            mosDevice = this.registerMosDevice(this._conf.mosID, parsed.mos.ncsID, null, null, null);
                        }
                    }
                    if (mosDevice) {
                        mosDevice.routeData(parsed).then((message) => {
                            sendReply(message);
                        }).catch((err) => {
                            // Something went wrong
                            if (err instanceof MosMessage_1.MosMessage) {
                                sendReply(err);
                            }
                            else {
                                // Unknown / internal error
                                // Log error:
                                console.log(err);
                                // reply with NACK:
                                // TODO: implement ACK
                                // http://mosprotocol.com/wp-content/MOS-Protocol-Documents/MOS_Protocol_Version_2.8.5_Final.htm#mosAck
                                let msg = new mosAck_1.MOSAck();
                                msg.ID = new mosString128_1.MosString128(0);
                                msg.Revision = 0;
                                msg.Description = new mosString128_1.MosString128('Internal Error');
                                msg.Status = api_1.IMOSAckStatus.NACK;
                                sendReply(msg); // TODO: Need tests
                            }
                            // console.log(err)
                        });
                    }
                    else {
                        // TODO: Handle missing mosDevice
                        // should reply with a NACK
                        let msg = new mosAck_1.MOSAck();
                        msg.ID = new mosString128_1.MosString128(0);
                        msg.Revision = 0;
                        msg.Description = new mosString128_1.MosString128('MosDevice not found');
                        msg.Status = api_1.IMOSAckStatus.NACK;
                        sendReply(msg); // TODO: Need tests
                    }
                }
            }
            catch (e) {
                console.log('chunks-------------\n', client.chunks);
                console.log('messageString---------\n', messageString);
                this.emit('error', e);
            }
        });
        client.socket.on('error', (e) => {
            if (this._debug)
                console.log(`Socket had error (${socketID}, ${client.socket.remoteAddress}, ${client.portDescription}): ${e}`);
        });
        // registers socket on server
        // e.socket.remoteAddress är ej OK id, måste bytas ut
        // let server: Server = this._getServerForHost(e.socket.remoteAddress)
        // server.registerIncomingConnection(socketID, e.socket, e.portDescription)
        this._incomingSockets[socketID + ''] = client;
        if (this._debug)
            console.log('added: ', socketID);
    }
    /** */
    _disposeIncomingSocket(socketID) {
        let e = this._incomingSockets[socketID + ''];
        if (e) {
            e.socket.removeAllListeners();
            e.socket.destroy();
        }
        delete this._incomingSockets[socketID + ''];
        // e.socket.remoteAddress är ej OK id, måste bytas ut
        // this._getServerForHost(socket.remoteAddress).removeSocket(socketID)
        if (this._debug)
            console.log('removed: ', socketID, '\n');
    }
    static get nextSocketID() {
        return this._nextSocketID++ + '';
    }
}
MosConnection.CONNECTION_PORT_LOWER = 10540;
MosConnection.CONNECTION_PORT_UPPER = 10541;
MosConnection.CONNECTION_PORT_QUERY = 10542;
MosConnection._nextSocketID = 0;
exports.MosConnection = MosConnection;
//# sourceMappingURL=MosConnection.js.map