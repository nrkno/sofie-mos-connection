"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MosMessage_1 = require("../mosModel/MosMessage");
const XMLBuilder = require("xmlbuilder");
const Parser_1 = require("./Parser");
class MosListAll extends MosMessage_1.MosMessage {
    /** */
    constructor(objs) {
        super();
        this.objs = objs;
    }
    /** */
    get messageXMLBlocks() {
        let root = XMLBuilder.create('mosListAll');
        this.objs.forEach((obj) => {
            root.importDocument(Parser_1.Parser.mosObj2xml(obj));
        });
        return root;
    }
}
exports.MosListAll = MosListAll;
//# sourceMappingURL=1_mosListAll.js.map