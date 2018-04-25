"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MosMessage_1 = require("../mosModel/MosMessage");
const Parser_1 = require("./Parser");
class MosObj extends MosMessage_1.MosMessage {
    /** */
    constructor(obj) {
        super();
        this.obj = obj;
    }
    /** */
    get messageXMLBlocks() {
        return Parser_1.Parser.mosObj2xml(this.obj);
    }
}
exports.MosObj = MosObj;
//# sourceMappingURL=1_mosObj.js.map