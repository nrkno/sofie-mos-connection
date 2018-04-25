"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
const MosMessage_1 = require("./MosMessage");
const Parser_1 = require("./Parser");
class ROList extends MosMessage_1.MosMessage {
    /** */
    constructor() {
        super();
    }
    /** */
    get messageXMLBlocks() {
        let root = XMLBuilder.create('roList');
        root.ele('roID', {}, this.RO.ID);
        root.ele('roSlug', {}, this.RO.Slug);
        this.RO.Stories.forEach((story) => {
            let xmlStory = Parser_1.Parser.story2xml(story);
            root.importDocument(xmlStory);
        });
        return root;
    }
}
exports.ROList = ROList;
//# sourceMappingURL=ROList.js.map