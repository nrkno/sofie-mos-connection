"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** */
var SocketConnectionEvent;
(function (SocketConnectionEvent) {
    SocketConnectionEvent["CONNECTED"] = "eventsocketconnectionconnected";
    SocketConnectionEvent["DISCONNECTED"] = "eventsocketconnectiondisconnected";
    SocketConnectionEvent["DISPOSED"] = "eventsocketconnectiondisposed";
    SocketConnectionEvent["TIMEOUT"] = "eventsocketconnectiontimeout";
    SocketConnectionEvent["ALIVE"] = "eventsocketconnectionalive";
    SocketConnectionEvent["REGISTER"] = "eventsocketconnectionregister";
    SocketConnectionEvent["UNREGISTER"] = "eventsocketconnectionunregister";
})(SocketConnectionEvent = exports.SocketConnectionEvent || (exports.SocketConnectionEvent = {}));
/** */
var SocketServerEvent;
(function (SocketServerEvent) {
    // LISTENING = 'eventsocketserverlistening',
    // DISPOSED = 'eventsocketserverdisposed',
    // ALIVE = 'eventsocketserveralive',
    SocketServerEvent["CLIENT_CONNECTED"] = "eventsocketserverclientconnected";
})(SocketServerEvent = exports.SocketServerEvent || (exports.SocketServerEvent = {}));
//# sourceMappingURL=socketConnection.js.map