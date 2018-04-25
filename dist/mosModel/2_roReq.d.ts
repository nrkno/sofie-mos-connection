import * as XMLBuilder from 'xmlbuilder';
import { MosMessage } from './MosMessage';
import { MosString128 } from '../dataTypes/mosString128';
export declare class ROReq extends MosMessage {
    private roId;
    /** */
    constructor(roId: MosString128);
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
