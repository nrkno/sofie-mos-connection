"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
const MosMessage_1 = require("./MosMessage");
class ROAck extends MosMessage_1.MosMessage {
    /** */
    constructor() {
        super();
    }
    /** */
    get messageXMLBlocks() {
        let root = XMLBuilder.create('roAck');
        root.ele('roID', {}, this.ID.toString());
        root.ele('roStatus', {}, this.Status.toString());
        // TODO: Loop over Stories, Items and Object
        return root;
    }
}
exports.ROAck = ROAck;
//# sourceMappingURL=ROAck.js.map