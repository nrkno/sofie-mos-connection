"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mosSocketClient_1 = require("../connection/mosSocketClient");
const _0_heartBeat_1 = require("../mosModel/0_heartBeat");
// Namnförslag: NCSServer
// Vi ansluter från oss till NCS
/** */
class NCSServerConnection {
    constructor(id, host, mosID, timeout, debug) {
        this._debug = false;
        this._clients = {};
        this._id = id;
        this._host = host;
        this._timeout = timeout || 5000;
        this._heartBeatsDelay = this._timeout / 2;
        this._mosID = mosID;
        this._connected = false;
        if (debug)
            this._debug = debug;
    }
    /** */
    registerOutgoingConnection(clientID, client, clientDescription) {
        if (this._debug)
            console.log('registerOutgoingConnection', clientID);
        this._clients[clientID] = {
            client: client,
            clientDescription: clientDescription
        };
    }
    createClient(clientID, port, clientDescription) {
        this.registerOutgoingConnection(clientID, new mosSocketClient_1.MosSocketClient(this._host, port, clientDescription, this._debug), clientDescription);
    }
    /** */
    removeClient(clientID) {
        this._clients[clientID].client.dispose();
        delete this._clients[clientID];
    }
    connect() {
        for (let i in this._clients) {
            // Connect client
            if (this._debug)
                console.log(`Connect client ${i} on ${this._clients[i].clientDescription} on host ${this._host}`);
            this._clients[i].client.connect();
        }
        this._connected = true;
        // Send heartbeat and check connection
        this._heartBeatsTimer = global.setInterval(() => this._sendHeartBeats(), this._heartBeatsDelay);
        // Emit to _callbackOnConnectionChange
        if (this._callbackOnConnectionChange)
            this._callbackOnConnectionChange();
    }
    executeCommand(message) {
        // Fill with clients
        let clients;
        // Set mosID and ncsID
        message.mosID = this._mosID;
        message.ncsID = this._id;
        // Example: Port based on message type
        if (message.port === 'lower') {
            clients = this.lowerPortClients;
        }
        else if (message.port === 'upper') {
            clients = this.upperPortClients;
        }
        else if (message.port === 'query') {
            clients = this.queryPortClients;
        }
        else {
            throw Error('Unknown port name: "' + message.port + '"');
        }
        return new Promise((resolve, reject) => {
            if (clients && clients.length) {
                clients[0].queueCommand(message, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            }
            else {
                reject('No clients found');
            }
        });
    }
    onConnectionChange(cb) {
        this._callbackOnConnectionChange = cb;
    }
    get connected() {
        return this._connected;
    }
    /** */
    get lowerPortClients() {
        let clients = [];
        for (let i in this._clients) {
            if (this._clients[i].clientDescription === 'lower') {
                clients.push(this._clients[i].client);
            }
        }
        return clients;
    }
    /** */
    get upperPortClients() {
        let clients = [];
        for (let i in this._clients) {
            if (this._clients[i].clientDescription === 'upper') {
                clients.push(this._clients[i].client);
            }
        }
        return clients;
    }
    /** */
    get queryPortClients() {
        let clients = [];
        for (let i in this._clients) {
            if (this._clients[i].clientDescription === 'query') {
                clients.push(this._clients[i].client);
            }
        }
        return clients;
    }
    dispose() {
        return new Promise((resolveDispose) => {
            for (let i in this._clients) {
                this.removeClient(parseInt(i, 10));
            }
            global.clearInterval(this._heartBeatsTimer);
            this._connected = false;
            if (this._callbackOnConnectionChange)
                this._callbackOnConnectionChange();
            resolveDispose();
        });
    }
    _sendHeartBeats() {
        for (let i in this._clients) {
            let heartbeat = new _0_heartBeat_1.HeartBeat();
            heartbeat.port = this._clients[i].clientDescription;
            this.executeCommand(heartbeat).then((data) => {
                if (this._debug)
                    console.log(`Heartbeat on ${this._clients[i].clientDescription} received.`, data);
            });
        }
    }
}
exports.NCSServerConnection = NCSServerConnection;
//# sourceMappingURL=NCSServerConnection.js.map