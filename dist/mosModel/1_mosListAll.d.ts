import { MosMessage } from '../mosModel/MosMessage';
import * as XMLBuilder from 'xmlbuilder';
import { IMOSObject } from '../api';
export declare class MosListAll extends MosMessage {
    objs: Array<IMOSObject>;
    /** */
    constructor(objs: Array<IMOSObject>);
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
