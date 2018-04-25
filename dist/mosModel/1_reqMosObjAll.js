"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
const MosMessage_1 = require("./MosMessage");
class ReqMosObjAll extends MosMessage_1.MosMessage {
    /** */
    constructor(pause = 0) {
        super();
        this.pause = pause;
        this.port = 'lower';
    }
    /** */
    get messageXMLBlocks() {
        let root = XMLBuilder.create('mosReqAll');
        root.ele('pause', {}, this.pause + '');
        return root;
    }
}
exports.ReqMosObjAll = ReqMosObjAll;
//# sourceMappingURL=1_reqMosObjAll.js.map