"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
const MosMessage_1 = require("./MosMessage");
class ROReqAll extends MosMessage_1.MosMessage {
    /** */
    constructor() {
        super();
        this.port = 'upper';
    }
    /** */
    get messageXMLBlocks() {
        let root = XMLBuilder.create('roReqAll');
        return root;
    }
}
exports.ROReqAll = ROReqAll;
//# sourceMappingURL=4_roReqAll.js.map