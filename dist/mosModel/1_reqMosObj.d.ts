import * as XMLBuilder from 'xmlbuilder';
import { MosMessage } from './MosMessage';
import { MosString128 } from '../dataTypes/mosString128';
export declare class ReqMosObj extends MosMessage {
    private objId;
    /** */
    constructor(objId: MosString128);
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
