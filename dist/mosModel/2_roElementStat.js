"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
const MosMessage_1 = require("./MosMessage");
const mosTime_1 = require("../dataTypes/mosTime");
var ROElementStatType;
(function (ROElementStatType) {
    ROElementStatType["RO"] = "RO";
    ROElementStatType["STORY"] = "STORY";
    ROElementStatType["ITEM"] = "ITEM";
})(ROElementStatType = exports.ROElementStatType || (exports.ROElementStatType = {}));
class ROElementStat extends MosMessage_1.MosMessage {
    /** */
    constructor(options) {
        super();
        this.options = options;
        this.time = new mosTime_1.MosTime();
        this.port = 'upper';
    }
    /** */
    get messageXMLBlocks() {
        let root = XMLBuilder.create('roElementStat');
        root.attribute('element', this.options.type.toString());
        root.ele('roID', {}, this.options.roId.toString());
        if (this.options.storyId)
            root.ele('storyID', {}, this.options.storyId.toString());
        if (this.options.itemId)
            root.ele('itemID', {}, this.options.itemId.toString());
        if (this.options.objId)
            root.ele('objID', {}, this.options.objId.toString());
        if (this.options.itemChannel)
            root.ele('itemChannel', {}, this.options.itemChannel.toString());
        root.ele('status', {}, this.options.status.toString());
        root.ele('time', {}, this.time.toString());
        return root;
    }
}
exports.ROElementStat = ROElementStat;
//# sourceMappingURL=2_roElementStat.js.map