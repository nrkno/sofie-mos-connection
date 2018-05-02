import { IProfiles } from './config/connectionConfig';
import { MosTime } from './dataTypes/mosTime';
import { MosDuration } from './dataTypes/mosDuration';
import { MosString128 } from './dataTypes/mosString128';
import { IMOSExternalMetaData } from './dataTypes/mosExternalMetaData';
import { IMOSListMachInfo } from './mosModel/0_listMachInfo';
import { MosDevice } from './MosDevice';
export interface IMosConnection {
    readonly isListening: Promise<boolean[]>;
    readonly acceptsConnections: boolean;
    readonly profiles: IProfiles;
    readonly isCompliant: boolean;
    readonly complianceText: string;
    dispose: () => Promise<void>;
    connect: (connectionOptions: IMOSDeviceConnectionOptions) => Promise<MosDevice>;
    onConnection: (cb: (mosDevice: MosDevice) => void) => void;
}
export interface IMOSDevice {
    idPrimary: string;
    idSecondary: string | null;
    getMachineInfo: () => Promise<IMOSListMachInfo>;
    onGetMachineInfo: (cb: () => Promise<IMOSListMachInfo>) => void;
    onConnectionChange: (cb: (connectionStatus: IMOSConnectionStatus) => void) => void;
    getConnectionStatus: () => IMOSConnectionStatus;
    onRequestMOSObject: (cb: (objId: string) => Promise<IMOSObject | null>) => void;
    onRequestAllMOSObjects: (cb: () => Promise<Array<IMOSObject>>) => void;
    getMOSObject: (objId: MosString128) => Promise<IMOSObject>;
    getAllMOSObjects: () => Promise<Array<IMOSObject>>;
    onCreateRunningOrder: (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) => void;
    onReplaceRunningOrder: (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) => void;
    onDeleteRunningOrder: (cb: (runningOrderId: MosString128) => Promise<IMOSROAck>) => void;
    onRequestRunningOrder: (cb: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>) => void;
    getRunningOrder: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>;
    onMetadataReplace: (cb: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>) => void;
    onRunningOrderStatus: (cb: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>) => void;
    onStoryStatus: (cb: (status: IMOSStoryStatus) => Promise<IMOSROAck>) => void;
    onItemStatus: (cb: (status: IMOSItemStatus) => Promise<IMOSROAck>) => void;
    setRunningOrderStatus: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>;
    setStoryStatus: (status: IMOSStoryStatus) => Promise<IMOSROAck>;
    setItemStatus: (status: IMOSItemStatus) => Promise<IMOSROAck>;
    onReadyToAir: (cb: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>) => void;
    onROInsertStories: (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>) => void;
    onROInsertItems: (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>) => void;
    onROReplaceStories: (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>) => void;
    onROReplaceItems: (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>) => void;
    onROMoveStories: (cb: (Action: IMOSStoryAction, Stories: Array<MosString128>) => Promise<IMOSROAck>) => void;
    onROMoveItems: (cb: (Action: IMOSItemAction, Items: Array<MosString128>) => Promise<IMOSROAck>) => void;
    onRODeleteStories: (cb: (Action: IMOSROAction, Stories: Array<MosString128>) => Promise<IMOSROAck>) => void;
    onRODeleteItems: (cb: (Action: IMOSStoryAction, Items: Array<MosString128>) => Promise<IMOSROAck>) => void;
    onROSwapStories: (cb: (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => Promise<IMOSROAck>) => void;
    onROSwapItems: (cb: (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => Promise<IMOSROAck>) => void;
    getAllRunningOrders: () => Promise<Array<IMOSRunningOrderBase>>;
    onROStory: (cb: (story: IMOSROFullStory) => Promise<IMOSROAck>) => void;
}
export { IMOSListMachInfo };
export interface IMOSROAction {
    RunningOrderID: MosString128;
}
export interface IMOSStoryAction extends IMOSROAction {
    StoryID: MosString128;
}
export interface IMOSItemAction extends IMOSStoryAction {
    ItemID: MosString128;
}
export interface IMOSROReadyToAir {
    ID: MosString128;
    Status: IMOSObjectAirStatus;
}
export interface IMOSRunningOrderStatus {
    ID: MosString128;
    Status: IMOSObjectStatus;
    Time: MosTime;
}
export interface IMOSStoryStatus {
    RunningOrderId: MosString128;
    ID: MosString128;
    Status: IMOSObjectStatus;
    Time: MosTime;
}
export interface IMOSItemStatus {
    RunningOrderId: MosString128;
    StoryId: MosString128;
    ID: MosString128;
    Status: IMOSObjectStatus;
    Time: MosTime;
    ObjectId?: MosString128;
    Channel?: MosString128;
}
export interface IMOSRunningOrderBase {
    ID: MosString128;
    Slug: MosString128;
    DefaultChannel?: MosString128;
    EditorialStart?: MosTime;
    EditorialDuration?: MosDuration;
    Trigger?: MosString128;
    MacroIn?: MosString128;
    MacroOut?: MosString128;
    MosExternalMetaData?: Array<IMOSExternalMetaData>;
}
export interface IMOSRunningOrder extends IMOSRunningOrderBase {
    Stories: Array<IMOSROStory>;
}
export interface IMOSStory {
    ID: MosString128;
    Slug?: MosString128;
    Number?: MosString128;
    MosExternalMetaData?: Array<IMOSExternalMetaData>;
}
export interface IMOSROStory extends IMOSStory {
    Items: Array<IMOSItem>;
}
export interface IMOSROFullStory extends IMOSStory {
    RunningOrderId: MosString128;
    Body: Array<IMOSROFullStoryBodyItem>;
}
export interface IMOSROFullStoryBodyItem {
    Type: string;
    Content: any | IMOSItem;
}
export interface IMOSItem {
    ID: MosString128;
    Slug?: MosString128;
    ObjectID: MosString128;
    MOSID: string;
    mosAbstract?: string;
    Paths?: Array<IMOSObjectPath>;
    Channel?: MosString128;
    EditorialStart?: number;
    EditorialDuration?: number;
    UserTimingDuration?: number;
    Trigger?: any;
    MacroIn?: MosString128;
    MacroOut?: MosString128;
    MosExternalMetaData?: Array<IMOSExternalMetaData>;
    MosObjects?: Array<IMOSObject>;
}
export declare type MosDuration = MosDuration;
export interface IMOSAck {
    ID: MosString128;
    Revision: Number;
    Status: IMOSAckStatus;
    Description: MosString128;
}
export interface IMOSROAck {
    ID: MosString128;
    Status: MosString128;
    Stories: Array<IMOSROAckStory>;
}
export interface IMOSROAckStory {
    ID: MosString128;
    Items: Array<IMOSROAckItem>;
}
export interface IMOSROAckItem {
    ID: MosString128;
    Channel: MosString128;
    Objects: Array<IMOSROAckObject>;
}
export interface IMOSROAckObject {
    Status: IMOSObjectStatus;
}
export interface IMOSConnectionStatus {
    PrimaryConnected: boolean;
    PrimaryStatus: string;
    SecondaryConnected: boolean;
    SecondaryStatus: string;
}
export interface IMOSDeviceConnectionOptions {
    primary: {
        id: string;
        host: string;
        ports?: {
            upper: number;
            lower: number;
            query: number;
        };
        timeout?: number;
    };
    secondary?: {
        id: string;
        host: string;
        ports?: {
            upper: number;
            lower: number;
            query: number;
        };
        timeout?: number;
    };
}
export interface IMOSObject {
    ID: MosString128;
    Slug: MosString128;
    MosAbstract?: string;
    Group?: string;
    Type: IMOSObjectType;
    TimeBase: number;
    Revision: number;
    Duration: number;
    Status: IMOSObjectStatus;
    AirStatus: IMOSObjectAirStatus;
    Paths: Array<IMOSObjectPath>;
    CreatedBy: MosString128;
    Created: MosTime;
    ChangedBy?: MosString128;
    Changed?: MosTime;
    Description?: any;
    MosExternalMetaData?: Array<IMOSExternalMetaData>;
}
export declare enum IMOSObjectType {
    STILL = "STILL",
    AUDIO = "AUDIO",
    VIDEO = "VIDEO",
}
export declare enum IMOSObjectStatus {
    NEW = "NEW",
    UPDATED = "UPDATED",
    MOVED = "MOVED",
    BUSY = "BUSY",
    DELETED = "DELETED",
    NCS_CTRL = "NCS CTRL",
    MANUAL_CTRL = "MANUAL CTRL",
    READY = "READY",
    NOT_READY = "NOT READY",
    PLAY = "PLAY",
    STOP = "STOP",
}
export declare enum IMOSAckStatus {
    ACK = "ACK",
    NACK = "NACK",
}
export declare enum IMOSObjectAirStatus {
    READY = "READY",
    NOT_READY = "NOT READY",
}
export interface IMOSObjectPath {
    Type: IMOSObjectPathType;
    Description: string;
    Target: string;
}
export declare enum IMOSObjectPathType {
    PATH = "PATH",
    PROXY_PATH = "PROXY PATH",
    METADATA_PATH = "METADATA PATH",
}
export { IMOSExternalMetaData };
