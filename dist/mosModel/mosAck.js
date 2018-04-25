"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
const MosMessage_1 = require("./MosMessage");
const api_1 = require("../api");
class MOSAck extends MosMessage_1.MosMessage {
    /** */
    constructor() {
        super();
    }
    /** */
    get messageXMLBlocks() {
        let root = XMLBuilder.create('roAck');
        root.ele('objID', {}, this.ID.toString());
        root.ele('objRev', {}, this.Revision);
        root.ele('status', {}, api_1.IMOSAckStatus[this.Status]);
        root.ele('statusDescription', {}, this.Description.toString());
        return root;
    }
}
exports.MOSAck = MOSAck;
//# sourceMappingURL=mosAck.js.map