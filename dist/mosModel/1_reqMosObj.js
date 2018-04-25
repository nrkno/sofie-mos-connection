"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
const MosMessage_1 = require("./MosMessage");
class ReqMosObj extends MosMessage_1.MosMessage {
    /** */
    constructor(objId) {
        super();
        this.port = 'lower';
        this.objId = objId;
    }
    /** */
    get messageXMLBlocks() {
        let root = XMLBuilder.create('mosReqObj');
        root.ele('objID', {}, this.objId.toString());
        return root;
    }
}
exports.ReqMosObj = ReqMosObj;
//# sourceMappingURL=1_reqMosObj.js.map