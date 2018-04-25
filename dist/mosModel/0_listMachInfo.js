"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MosMessage_1 = require("../mosModel/MosMessage");
const XMLBuilder = require("xmlbuilder");
var IMOSListMachInfoDefaultActiveXMode;
(function (IMOSListMachInfoDefaultActiveXMode) {
    IMOSListMachInfoDefaultActiveXMode["MODALDIALOG"] = "MODALDIALOG";
    IMOSListMachInfoDefaultActiveXMode["MODELESS"] = "MODELESS";
    IMOSListMachInfoDefaultActiveXMode["CONTAINED"] = "CONTAINED";
    IMOSListMachInfoDefaultActiveXMode["TOOLBAR"] = "TOOLBAR";
})(IMOSListMachInfoDefaultActiveXMode = exports.IMOSListMachInfoDefaultActiveXMode || (exports.IMOSListMachInfoDefaultActiveXMode = {}));
class ListMachineInfo extends MosMessage_1.MosMessage {
    /** */
    constructor(info) {
        super();
        this.info = info;
    }
    /** */
    get messageXMLBlocks() {
        let root = XMLBuilder.create('listMachInfo');
        root.ele('manufacturer', this.info.manufacturer.toString());
        root.ele('model', this.info.model.toString());
        root.ele('hwRev', this.info.hwRev.toString());
        root.ele('swRev', this.info.swRev.toString());
        root.ele('DOM', this.info.DOM.toString());
        root.ele('SN', this.info.SN.toString());
        root.ele('ID', this.info.ID.toString());
        root.ele('time', this.info.time.toString());
        if (this.info.opTime)
            root.ele('opTime', this.info.opTime.toString());
        root.ele('mosRev', this.info.mosRev.toString());
        let p = root.ele('supportedProfiles').att('deviceType', this.info.supportedProfiles.deviceType);
        for (let i = 0; i < 8; i++) {
            // @ts-ignore
            p.ele('mosProfile', (this.info.supportedProfiles['profile' + i] ? 'YES' : 'NO')).att('number', i);
        }
        return root;
    }
}
exports.ListMachineInfo = ListMachineInfo;
//# sourceMappingURL=0_listMachInfo.js.map