import { MosTime } from '../dataTypes/mosTime';
import { MosString128 } from '../dataTypes/mosString128';
import { IMOSExternalMetaData } from '../dataTypes/mosExternalMetaData';
import { MosMessage } from '../mosModel/MosMessage';
import * as XMLBuilder from 'xmlbuilder';
export declare enum IMOSListMachInfoDefaultActiveXMode {
    MODALDIALOG = "MODALDIALOG",
    MODELESS = "MODELESS",
    CONTAINED = "CONTAINED",
    TOOLBAR = "TOOLBAR",
}
export interface IMOSDefaultActiveX {
    mode: IMOSListMachInfoDefaultActiveXMode;
    controlFileLocation: string;
    controlSlug: MosString128;
    controlName: string;
    controlDefaultParams: string;
}
export interface IMOSListMachInfo {
    manufacturer: MosString128;
    model: MosString128;
    hwRev: MosString128;
    swRev: MosString128;
    DOM: MosTime;
    SN: MosString128;
    ID: MosString128;
    time: MosTime;
    opTime?: MosTime;
    mosRev: MosString128;
    supportedProfiles: {
        deviceType: string;
        profile0?: boolean;
        profile1?: boolean;
        profile2?: boolean;
        profile3?: boolean;
        profile4?: boolean;
        profile5?: boolean;
        profile6?: boolean;
        profile7?: boolean;
    };
    defaultActiveX?: Array<IMOSDefaultActiveX>;
    mosExternalMetaData?: Array<IMOSExternalMetaData>;
}
export declare class ListMachineInfo extends MosMessage {
    info: IMOSListMachInfo;
    /** */
    constructor(info: IMOSListMachInfo);
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
