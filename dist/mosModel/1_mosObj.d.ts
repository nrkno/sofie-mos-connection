import { MosMessage } from '../mosModel/MosMessage';
import * as XMLBuilder from 'xmlbuilder';
import { IMOSObject } from '../api';
export declare class MosObj extends MosMessage {
    obj: IMOSObject;
    /** */
    constructor(obj: IMOSObject);
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
