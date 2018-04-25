"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = require("net");
const mosString128_1 = require("./dataTypes/mosString128");
const mosTime_1 = require("./dataTypes/mosTime");
const mosDuration_1 = require("./dataTypes/mosDuration");
const _0_listMachInfo_1 = require("./mosModel/0_listMachInfo");
const ROAck_1 = require("./mosModel/ROAck");
const _0_reqMachInfo_1 = require("./mosModel/0_reqMachInfo");
const api_1 = require("./api");
const Parser_1 = require("./mosModel/Parser");
const mosAck_1 = require("./mosModel/mosAck");
const ROList_1 = require("./mosModel/ROList");
const _0_heartBeat_1 = require("./mosModel/0_heartBeat");
const _2_roReq_1 = require("./mosModel/2_roReq");
const _2_roElementStat_1 = require("./mosModel/2_roElementStat");
const _1_mosObj_1 = require("./mosModel/1_mosObj");
const _1_mosListAll_1 = require("./mosModel/1_mosListAll");
const _1_reqMosObj_1 = require("./mosModel/1_reqMosObj");
const _1_reqMosObjAll_1 = require("./mosModel/1_reqMosObjAll");
class MosDevice {
    constructor(idPrimary, idSecondary, connectionConfig, primaryConnection, secondaryConnection) {
        this._debug = false;
        this.supportedProfiles = {
            deviceType: 'MOS',
            profile0: false,
            profile1: false,
            profile2: false,
            profile3: false,
            profile4: false,
            profile5: false,
            profile6: false,
            profile7: false
        }; // Use same names as IProfiles?
        // private _profiles: ProfilesSupport
        this._primaryConnection = null;
        this._secondaryConnection = null;
        this._currentConnection = null;
        // this._id = new MosString128(connectionConfig.mosID).toString()
        this._idPrimary = idPrimary;
        this._idSecondary = idSecondary;
        this.socket = new net_1.Socket();
        // Add params to this in MosConnection/MosDevice
        this.manufacturer = new mosString128_1.MosString128('RadioVision, Ltd.');
        this.model = new mosString128_1.MosString128('TCS6000');
        this.hwRev = new mosString128_1.MosString128('0.1'); // empty string returnes <hwRev/>
        this.swRev = new mosString128_1.MosString128('0.1');
        this.DOM = new mosTime_1.MosTime();
        this.SN = new mosString128_1.MosString128('927748927');
        this.ID = new mosString128_1.MosString128(connectionConfig ? connectionConfig.mosID : '');
        this.time = new mosTime_1.MosTime();
        this.opTime = new mosTime_1.MosTime();
        this.mosRev = new mosString128_1.MosString128('2.8.5');
        if (connectionConfig) {
            if (connectionConfig.profiles['0'])
                this.supportedProfiles.profile0 = true;
            if (connectionConfig.profiles['1'])
                this.supportedProfiles.profile1 = true;
            if (connectionConfig.profiles['2'])
                this.supportedProfiles.profile2 = true;
            if (connectionConfig.profiles['3'])
                this.supportedProfiles.profile3 = true;
            if (connectionConfig.profiles['4'])
                this.supportedProfiles.profile4 = true;
            if (connectionConfig.profiles['5'])
                this.supportedProfiles.profile5 = true;
            if (connectionConfig.profiles['6'])
                this.supportedProfiles.profile6 = true;
            if (connectionConfig.profiles['7'])
                this.supportedProfiles.profile7 = true;
            if (connectionConfig.debug)
                this._debug = connectionConfig.debug;
        }
        if (primaryConnection) {
            this._primaryConnection = primaryConnection;
            this._primaryConnection.onConnectionChange(() => this.emitConnectionChange());
        }
        if (secondaryConnection) {
            this._secondaryConnection = secondaryConnection;
            this._secondaryConnection.onConnectionChange(() => this.emitConnectionChange());
        }
        this._currentConnection = this._primaryConnection || this._primaryConnection || null;
    }
    get hasConnection() {
        return !!this._currentConnection;
    }
    get idPrimary() {
        return this._idPrimary;
    }
    get idSecondary() {
        return this._idSecondary;
    }
    emitConnectionChange() {
        if (this._callbackOnConnectionChange)
            this._callbackOnConnectionChange(this.getConnectionStatus());
    }
    connect() {
        if (this._primaryConnection)
            this._primaryConnection.connect();
        if (this._secondaryConnection)
            this._secondaryConnection.connect();
    }
    routeData(data) {
        if (data && data.hasOwnProperty('mos'))
            data = data['mos'];
        return new Promise((resolve, reject) => {
            if (this._debug) {
                console.log('parsedData', data);
                // console.log('parsedTest', keys)
                console.log('keys', Object.keys(data));
            }
            // Route and format data:
            // Profile 0:
            if (data.heartbeat) {
                // send immediate reply:
                let ack = new _0_heartBeat_1.HeartBeat();
                resolve(ack);
            }
            else if (data.reqMachInfo && typeof this._callbackOnGetMachineInfo === 'function') {
                this._callbackOnGetMachineInfo().then((m) => {
                    let resp = new _0_listMachInfo_1.ListMachineInfo(m);
                    resolve(resp);
                });
                // Profile 1:
            }
            else if (data.mosReqObj && typeof this._callbackOnRequestMOSOBject === 'function') {
                this._callbackOnRequestMOSOBject(data.mosReqObj.objID).then((mosObj) => {
                    let resp = new _1_mosObj_1.MosObj(mosObj);
                    resolve(resp);
                });
            }
            else if (data.mosReqAll && typeof this._callbackOnRequestAllMOSObjects === 'function') {
                this._callbackOnRequestAllMOSObjects().then((mosObjs) => {
                    let resp = new _1_mosListAll_1.MosListAll(mosObjs);
                    resolve(resp);
                });
                // Profile 2:
            }
            else if (data.roCreate && typeof this._callbackOnCreateRunningOrder === 'function') {
                let stories = Parser_1.Parser.xml2Stories(data.roCreate.story);
                let ro = {
                    ID: new mosString128_1.MosString128(data.roCreate.roID),
                    Slug: new mosString128_1.MosString128(data.roCreate.roSlug),
                    Stories: stories
                };
                if (data.roCreate.hasOwnProperty('roEdStart'))
                    ro.EditorialStart = new mosTime_1.MosTime(data.roCreate.roEdStart);
                if (data.roCreate.hasOwnProperty('roEdDur'))
                    ro.EditorialDuration = new mosDuration_1.MosDuration(data.roCreate.roEdDur);
                if (data.roCreate.hasOwnProperty('mosExternalMetadata')) {
                    // TODO: Handle an array of mosExternalMetadata
                    let meta = {
                        MosSchema: data.roCreate.mosExternalMetadata.mosSchema,
                        MosPayload: data.roCreate.mosExternalMetadata.mosPayload
                    };
                    if (data.roCreate.mosExternalMetadata.hasOwnProperty('mosScope'))
                        meta.MosScope = data.roCreate.mosExternalMetadata.mosScope;
                    ro.MosExternalMetaData = [meta];
                }
                // TODO: Add & test DefaultChannel, Trigger, MacroIn, MacroOut
                this._callbackOnCreateRunningOrder(ro).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roReplace && typeof this._callbackOnReplaceRunningOrder === 'function') {
                let ro = Parser_1.Parser.xml2RO(data.roReplace);
                this._callbackOnReplaceRunningOrder(ro).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roDelete && typeof this._callbackOnDeleteRunningOrder === 'function') {
                // TODO: Change runningOrderId to RunningOrderID in interface?
                this._callbackOnDeleteRunningOrder(data.roDelete.roID).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roReq && typeof this._callbackOnRequestRunningOrder === 'function') {
                this._callbackOnRequestRunningOrder(data.roReq.roID).then((ro) => {
                    if (ro) {
                        let resp = new ROList_1.ROList();
                        resp.RO = ro;
                        resolve(resp);
                    }
                    else {
                        // RO not found
                        let ack = new ROAck_1.ROAck();
                        ack.ID = data.roReq.roID;
                        ack.Status = new mosString128_1.MosString128(api_1.IMOSAckStatus.NACK);
                        // ack.Stories = resp.Stories
                        resolve(ack);
                    }
                }).catch(reject);
            }
            else if (data.roMetadataReplace && typeof this._callbackOnMetadataReplace === 'function') {
                let ro = Parser_1.Parser.xml2ROBase(data.roMetadataReplace);
                this._callbackOnMetadataReplace(ro).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementStat && data.roElementStat.element === 'RO' && typeof this._callbackOnRunningOrderStatus === 'function') {
                let status = {
                    ID: new mosString128_1.MosString128(data.roElementStat.roID),
                    Status: data.roElementStat.status,
                    Time: new mosTime_1.MosTime(data.roElementStat.time)
                };
                this._callbackOnRunningOrderStatus(status).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementStat && data.roElementStat.element === 'STORY' && typeof this._callbackOnStoryStatus === 'function') {
                let status = {
                    RunningOrderId: new mosString128_1.MosString128(data.roElementStat.roID),
                    ID: new mosString128_1.MosString128(data.roElementStat.storyID),
                    Status: data.roElementStat.status,
                    Time: new mosTime_1.MosTime(data.roElementStat.time)
                };
                this._callbackOnStoryStatus(status).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementStat &&
                data.roElementStat.element === 'ITEM' &&
                typeof this._callbackOnItemStatus === 'function') {
                let status = {
                    RunningOrderId: new mosString128_1.MosString128(data.roElementStat.roID),
                    StoryId: new mosString128_1.MosString128(data.roElementStat.storyID),
                    ID: new mosString128_1.MosString128(data.roElementStat.itemID),
                    Status: data.roElementStat.status,
                    Time: new mosTime_1.MosTime(data.roElementStat.time)
                };
                if (data.roElementStat.hasOwnProperty('objID'))
                    status.ObjectId = new mosString128_1.MosString128(data.roElementStat.objID);
                if (data.roElementStat.hasOwnProperty('itemChannel'))
                    status.Channel = new mosString128_1.MosString128(data.roElementStat.itemChannel);
                this._callbackOnItemStatus(status).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roReadyToAir && typeof this._callbackOnReadyToAir === 'function') {
                this._callbackOnReadyToAir({
                    ID: new mosString128_1.MosString128(data.roReadyToAir.roID),
                    Status: data.roReadyToAir.roAir
                }).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementAction &&
                data.roElementAction.operation === 'INSERT' &&
                (data.roElementAction.element_source || {}).story &&
                typeof this._callbackOnROInsertStories === 'function') {
                let action = {
                    RunningOrderID: new mosString128_1.MosString128(data.roElementAction.roID),
                    StoryID: new mosString128_1.MosString128(data.roElementAction.element_target.storyID)
                };
                let stories = Parser_1.Parser.xml2Stories([data.roElementAction.element_source.story]);
                this._callbackOnROInsertStories(action, stories)
                    .then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementAction &&
                data.roElementAction.operation === 'INSERT' &&
                (data.roElementAction.element_source || {}).item &&
                typeof this._callbackOnROInsertItems === 'function') {
                let action = {
                    RunningOrderID: new mosString128_1.MosString128(data.roElementAction.roID),
                    StoryID: new mosString128_1.MosString128(data.roElementAction.element_target.storyID),
                    ItemID: new mosString128_1.MosString128(data.roElementAction.element_target.itemID)
                };
                let items = Parser_1.Parser.xml2Items(data.roElementAction.element_source.item);
                this._callbackOnROInsertItems(action, items)
                    .then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    // ack.Stories = resp.Stories
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementAction &&
                data.roElementAction.operation === 'REPLACE' &&
                (data.roElementAction.element_source || {}).story &&
                typeof this._callbackOnROReplaceStories === 'function') {
                let action = {
                    RunningOrderID: new mosString128_1.MosString128(data.roElementAction.roID),
                    StoryID: new mosString128_1.MosString128(data.roElementAction.element_target.storyID)
                };
                let stories = Parser_1.Parser.xml2Stories([data.roElementAction.element_source.story]);
                this._callbackOnROReplaceStories(action, stories).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementAction &&
                data.roElementAction.operation === 'REPLACE' &&
                (data.roElementAction.element_source || {}).item &&
                typeof this._callbackOnROReplaceItems === 'function') {
                let action = {
                    RunningOrderID: new mosString128_1.MosString128(data.roElementAction.roID),
                    StoryID: new mosString128_1.MosString128(data.roElementAction.element_target.storyID),
                    ItemID: new mosString128_1.MosString128(data.roElementAction.element_target.itemID)
                };
                let items = Parser_1.Parser.xml2Items(data.roElementAction.element_source.item);
                this._callbackOnROReplaceItems(action, items)
                    .then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    // ack.Stories = resp.Stories
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementAction &&
                data.roElementAction.operation === 'MOVE' &&
                (data.roElementAction.element_source || {}).storyID &&
                typeof this._callbackOnROMoveStories === 'function') {
                let action = {
                    RunningOrderID: new mosString128_1.MosString128(data.roElementAction.roID),
                    StoryID: new mosString128_1.MosString128(data.roElementAction.element_target.storyID)
                };
                let storyIDs = Parser_1.Parser.xml2IDs(data.roElementAction.element_source.storyID);
                this._callbackOnROMoveStories(action, storyIDs).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementAction &&
                data.roElementAction.operation === 'MOVE' &&
                (data.roElementAction.element_source || {}).itemID &&
                typeof this._callbackOnROMoveItems === 'function') {
                let action = {
                    RunningOrderID: new mosString128_1.MosString128(data.roElementAction.roID),
                    StoryID: new mosString128_1.MosString128(data.roElementAction.element_target.storyID),
                    ItemID: new mosString128_1.MosString128(data.roElementAction.element_target.itemID)
                };
                let itemIDs = Parser_1.Parser.xml2IDs(data.roElementAction.element_source.itemID);
                this._callbackOnROMoveItems(action, itemIDs).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementAction &&
                data.roElementAction.operation === 'DELETE' &&
                data.roElementAction.element_source.storyID &&
                typeof this._callbackOnRODeleteStories === 'function') {
                let stories = Parser_1.Parser.xml2IDs(data.roElementAction.element_source.storyID);
                this._callbackOnRODeleteStories({
                    RunningOrderID: new mosString128_1.MosString128(data.roElementAction.roID)
                }, stories).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementAction &&
                data.roElementAction.operation === 'DELETE' &&
                data.roElementAction.element_source.itemID &&
                typeof this._callbackOnRODeleteItems === 'function') {
                let action = {
                    RunningOrderID: new mosString128_1.MosString128(data.roElementAction.roID),
                    StoryID: new mosString128_1.MosString128(data.roElementAction.element_target.storyID)
                };
                let items = Parser_1.Parser.xml2IDs(data.roElementAction.element_source.itemID);
                this._callbackOnRODeleteItems(action, items).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementAction &&
                data.roElementAction.operation === 'SWAP' &&
                data.roElementAction.element_source.storyID &&
                data.roElementAction.element_source.storyID.length === 2 &&
                typeof this._callbackOnROSwapStories === 'function') {
                let stories = Parser_1.Parser.xml2IDs(data.roElementAction.element_source.storyID);
                this._callbackOnROSwapStories({
                    RunningOrderID: new mosString128_1.MosString128(data.roElementAction.roID)
                }, stories[0], stories[1]).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
            }
            else if (data.roElementAction &&
                data.roElementAction.operation === 'SWAP' &&
                data.roElementAction.element_source.itemID &&
                data.roElementAction.element_source.itemID.length === 2 &&
                typeof this._callbackOnROSwapItems === 'function') {
                let items = Parser_1.Parser.xml2IDs(data.roElementAction.element_source.itemID);
                this._callbackOnROSwapItems({
                    RunningOrderID: new mosString128_1.MosString128(data.roElementAction.roID),
                    StoryID: new mosString128_1.MosString128(data.roElementAction.element_target.storyID)
                }, items[0], items[1]).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
                // Profile 4
            }
            else if (data.roStorySend && typeof this._callbackOnROStory === 'function') {
                let story = Parser_1.Parser.xml2FullStory(data.roStorySend);
                this._callbackOnROStory(story).then((resp) => {
                    let ack = new ROAck_1.ROAck();
                    ack.ID = resp.ID;
                    ack.Status = resp.Status;
                    ack.Stories = resp.Stories;
                    resolve(ack);
                }).catch(reject);
                // TODO: Use MosMessage instead of string
                // TODO: Use reject if function dont exists? Put Nack in ondata
            }
            else {
                console.log(data);
                let msg = new mosAck_1.MOSAck();
                msg.ID = new mosString128_1.MosString128(0); // Depends on type of message, needs logic
                msg.Revision = 0;
                msg.Description = new mosString128_1.MosString128('Unsupported function');
                msg.Status = api_1.IMOSAckStatus.NACK;
                resolve(msg);
                // resolve('<mos><mosID>test2.enps.mos</mosID><ncsID>2012R2ENPS8VM</ncsID><messageID>99</messageID><roAck><roID>2012R2ENPS8VM;P_ENPSMOS\W\F_HOLD ROs;DEC46951-28F9-4A11-8B0655D96B347E52</roID><roStatus>Unknown object M000133</roStatus><storyID>5983A501:0049B924:8390EF2B</storyID><itemID>0</itemID><objID>M000224</objID><status>LOADED</status><storyID>3854737F:0003A34D:983A0B28</storyID><itemID>0</itemID><objID>M000133</objID><itemChannel>A</itemChannel><status>UNKNOWN</status></roAck></mos>')
            }
        });
    }
    /* Profile 0 */
    getMachineInfo() {
        let message = new _0_reqMachInfo_1.ReqMachInfo();
        return new Promise((resolve, reject) => {
            if (this._currentConnection) {
                this._currentConnection.executeCommand(message).then((data) => {
                    let listMachInfo = data.mos.listMachInfo;
                    let list = {
                        manufacturer: listMachInfo.manufacturer,
                        model: listMachInfo.model,
                        hwRev: listMachInfo.hwRev,
                        swRev: listMachInfo.swRev,
                        DOM: listMachInfo.DOM,
                        SN: listMachInfo.SN,
                        ID: listMachInfo.ID,
                        time: listMachInfo.time,
                        opTime: listMachInfo.opTime,
                        mosRev: listMachInfo.mosRev,
                        supportedProfiles: this.supportedProfiles,
                        defaultActiveX: this.defaultActiveX,
                        mosExternalMetaData: this.mosExternalMetaData // TODO: No data from ENPS, needs test!
                    };
                    resolve(list);
                });
            }
            else {
                reject('No Connection');
            }
        });
    }
    onGetMachineInfo(cb) {
        this._callbackOnGetMachineInfo = cb;
    }
    onConnectionChange(cb) {
        this._callbackOnConnectionChange = cb;
    }
    getConnectionStatus() {
        // TODO: Implement this
        return {
            PrimaryConnected: (this._primaryConnection ? this._primaryConnection.connected : false),
            PrimaryStatus: '',
            SecondaryConnected: (this._secondaryConnection ? this._secondaryConnection.connected : false),
            SecondaryStatus: ''
        };
    }
    /* Profile 1 */
    onRequestMOSObject(cb) {
        this._callbackOnRequestMOSOBject = cb;
    }
    onRequestAllMOSObjects(cb) {
        this._callbackOnRequestAllMOSObjects = cb;
    }
    getMOSObject(objID) {
        let message = new _1_reqMosObj_1.ReqMosObj(objID);
        return new Promise((resolve, reject) => {
            if (this._currentConnection) {
                this._currentConnection.executeCommand(message).then((data) => {
                    if (data.mos.roAck) {
                        reject(data.mos.roAck);
                    }
                    else if (data.mos.mosObj) {
                        let obj = Parser_1.Parser.xml2MosObj(data.mos.mosObj);
                        resolve(obj);
                    }
                    else {
                        reject('Unknown response');
                    }
                });
            }
            else {
                reject('No Connection');
            }
        });
    }
    getAllMOSObjects() {
        let message = new _1_reqMosObjAll_1.ReqMosObjAll();
        return new Promise((resolve, reject) => {
            if (this._currentConnection) {
                this._currentConnection.executeCommand(message).then((data) => {
                    if (data.mos.roAck) {
                        reject(data.mos.roAck);
                    }
                    else if (data.mos.mosListAll) {
                        let objs = Parser_1.Parser.xml2MosObjs(data.mos.mosListAll.mosObj);
                        resolve(objs);
                    }
                    else {
                        reject('Unknown response');
                    }
                });
            }
            else {
                reject('No Connection');
            }
        });
    }
    /* Profile 2 */
    onCreateRunningOrder(cb) {
        this._callbackOnCreateRunningOrder = cb;
    }
    onReplaceRunningOrder(cb) {
        this._callbackOnReplaceRunningOrder = cb;
    }
    onDeleteRunningOrder(cb) {
        this._callbackOnDeleteRunningOrder = cb;
    }
    // onRequestRunningOrder: (cb: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>) => void // get roReq, send roList
    onRequestRunningOrder(cb) {
        this._callbackOnRequestRunningOrder = cb;
    }
    getRunningOrder(runningOrderId) {
        let message = new _2_roReq_1.ROReq(runningOrderId);
        return new Promise((resolve, reject) => {
            if (this._currentConnection) {
                this._currentConnection.executeCommand(message).then((data) => {
                    if (data.mos.roAck) {
                        reject(data.mos.roAck);
                    }
                    else if (data.mos.roList) {
                        let ro = Parser_1.Parser.xml2RO(data.mos.roList);
                        resolve(ro);
                    }
                    else {
                        reject('Unknown response');
                    }
                });
            }
            else {
                reject('No Connection');
            }
        });
    }
    onMetadataReplace(cb) {
        this._callbackOnMetadataReplace = cb;
    }
    onRunningOrderStatus(cb) {
        this._callbackOnRunningOrderStatus = cb;
    }
    onStoryStatus(cb) {
        this._callbackOnStoryStatus = cb;
    }
    onItemStatus(cb) {
        this._callbackOnItemStatus = cb;
    }
    setRunningOrderStatus(status) {
        let message = new _2_roElementStat_1.ROElementStat({
            type: _2_roElementStat_1.ROElementStatType.RO,
            roId: new mosString128_1.MosString128(status.ID),
            status: status.Status
        });
        return new Promise((resolve, reject) => {
            if (this._currentConnection) {
                this._currentConnection.executeCommand(message).then((data) => {
                    let roAck = Parser_1.Parser.xml2ROAck(data.mos.roAck);
                    resolve(roAck);
                });
            }
            else {
                reject('No Connection');
            }
        });
    }
    setStoryStatus(status) {
        let message = new _2_roElementStat_1.ROElementStat({
            type: _2_roElementStat_1.ROElementStatType.STORY,
            roId: new mosString128_1.MosString128(status.RunningOrderId),
            storyId: new mosString128_1.MosString128(status.ID),
            status: status.Status
        });
        return new Promise((resolve, reject) => {
            if (this._currentConnection) {
                this._currentConnection.executeCommand(message).then((data) => {
                    let roAck = Parser_1.Parser.xml2ROAck(data.mos.roAck);
                    resolve(roAck);
                });
            }
            else {
                reject('No Connection');
            }
        });
    }
    setItemStatus(status) {
        let message = new _2_roElementStat_1.ROElementStat({
            type: _2_roElementStat_1.ROElementStatType.ITEM,
            roId: new mosString128_1.MosString128(status.RunningOrderId),
            storyId: new mosString128_1.MosString128(status.StoryId),
            itemId: new mosString128_1.MosString128(status.ID),
            objId: new mosString128_1.MosString128(status.ObjectId),
            itemChannel: new mosString128_1.MosString128(status.Channel),
            status: status.Status
        });
        return new Promise((resolve, reject) => {
            if (this._currentConnection) {
                this._currentConnection.executeCommand(message).then((data) => {
                    let roAck = Parser_1.Parser.xml2ROAck(data.mos.roAck);
                    resolve(roAck);
                });
            }
            else {
                reject('No Connection');
            }
        });
    }
    onReadyToAir(cb) {
        this._callbackOnReadyToAir = cb;
    }
    onROInsertStories(cb) {
        this._callbackOnROInsertStories = cb;
    }
    onROInsertItems(cb) {
        this._callbackOnROInsertItems = cb;
    }
    onROReplaceStories(cb) {
        this._callbackOnROReplaceStories = cb;
    }
    onROReplaceItems(cb) {
        this._callbackOnROReplaceItems = cb;
    }
    onROMoveStories(cb) {
        this._callbackOnROMoveStories = cb;
    }
    onROMoveItems(cb) {
        this._callbackOnROMoveItems = cb;
    }
    onRODeleteStories(cb) {
        this._callbackOnRODeleteStories = cb;
    }
    onRODeleteItems(cb) {
        this._callbackOnRODeleteItems = cb;
    }
    onROSwapStories(cb) {
        this._callbackOnROSwapStories = cb;
    }
    onROSwapItems(cb) {
        this._callbackOnROSwapItems = cb;
    }
    /* Profile 4 */
    onROStory(cb) {
        this._callbackOnROStory = cb;
    }
}
exports.MosDevice = MosDevice;
//# sourceMappingURL=MosDevice.js.map