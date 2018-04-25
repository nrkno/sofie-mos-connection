"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
const MosMessage_1 = require("./MosMessage");
class ReqMachInfo extends MosMessage_1.MosMessage {
    /** */
    constructor() {
        super();
        this.port = 'lower';
    }
    /** */
    get messageXMLBlocks() {
        let messageBlock = XMLBuilder.create('reqMachInfo');
        return messageBlock;
    }
}
exports.ReqMachInfo = ReqMachInfo;
//# sourceMappingURL=0_reqMachInfo.js.map