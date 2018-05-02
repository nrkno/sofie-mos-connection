import * as XMLBuilder from 'xmlbuilder';
import { MosMessage } from './MosMessage';
export declare class ROReqAll extends MosMessage {
    /** */
    constructor();
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
