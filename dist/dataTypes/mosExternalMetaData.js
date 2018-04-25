"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
var IMOSScope;
(function (IMOSScope) {
    IMOSScope["OBJECT"] = "OBJECT";
    IMOSScope["STORY"] = "STORY";
    IMOSScope["PLAYLIST"] = "PLAYLIST";
})(IMOSScope = exports.IMOSScope || (exports.IMOSScope = {}));
class MosExternalMetaData {
    constructor(obj) {
        this._scope = obj.MosScope;
        this._schema = obj.MosSchema;
        this._payload = obj.MosPayload;
    }
    get scope() {
        return this._scope;
    }
    get schema() {
        return this._schema;
    }
    get payload() {
        return this._payload;
    }
    get messageXMLBlocks() {
        let root = XMLBuilder.create('mosExternalMetadata'); // config headless
        root.ele('mosScope', this._scope);
        root.ele('mosSchema', this._schema);
        root.ele('mosPayload', this._payload); // converts json to xml
        return root;
    }
}
exports.MosExternalMetaData = MosExternalMetaData;
//# sourceMappingURL=mosExternalMetaData.js.map