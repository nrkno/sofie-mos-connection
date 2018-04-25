"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
class MosMessage {
    static getNewMessageID() {
        // increments and returns a signed 32-bit int counting from 1, resetting to 1 when wrapping
        MosMessage._messageID++;
        if (MosMessage._messageID >= MosMessage.MAX_MESSAGE_ID)
            MosMessage._messageID = 1;
        return MosMessage._messageID;
    }
    /** */
    prepare(messageID) {
        if (!this.mosID)
            throw new Error(`Can't prepare message: mosID missing`);
        if (!this.ncsID)
            throw new Error(`Can't prepare message: ncsID missing`);
        // if (!this.port) throw new Error(`Can't prepare message: port missing`)
        this._messageID = (messageID ? messageID : MosMessage.getNewMessageID());
    }
    /** */
    get messageID() {
        return this._messageID;
    }
    /** */
    toString() {
        let xml = XMLBuilder.create('mos', undefined, undefined, {
            headless: true
        });
        xml.ele('ncsID', this.ncsID);
        xml.ele('mosID', this.mosID);
        xml.ele('messageID', this.messageID);
        xml.importDocument(this.messageXMLBlocks);
        return xml.end({ pretty: true });
    }
}
MosMessage.MAX_MESSAGE_ID = Math.pow(2, 31) - 2;
MosMessage._messageID = 1;
exports.MosMessage = MosMessage;
//# sourceMappingURL=MosMessage.js.map