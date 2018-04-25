"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
const mosTime_1 = require("./../dataTypes/mosTime");
const MosMessage_1 = require("./MosMessage");
class HeartBeat extends MosMessage_1.MosMessage {
    /** */
    constructor(time = new mosTime_1.MosTime()) {
        super();
        this.time = time;
    }
    /** */
    get messageXMLBlocks() {
        let messageBlock = XMLBuilder.create('heartbeat')
            .element('time', {}, this.time.toString());
        return messageBlock;
    }
}
exports.HeartBeat = HeartBeat;
//# sourceMappingURL=0_heartBeat.js.map