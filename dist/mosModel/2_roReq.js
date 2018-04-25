"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
const MosMessage_1 = require("./MosMessage");
class ROReq extends MosMessage_1.MosMessage {
    /** */
    constructor(roId) {
        super();
        this.port = 'upper';
        this.roId = roId;
    }
    /** */
    get messageXMLBlocks() {
        let root = XMLBuilder.create('roReq');
        root.ele('roID', {}, this.roId.toString());
        return root;
    }
}
exports.ROReq = ROReq;
//# sourceMappingURL=2_roReq.js.map