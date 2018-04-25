import * as XMLBuilder from 'xmlbuilder';
import { MosMessage } from './MosMessage';
export declare class ReqMosObjAll extends MosMessage {
    private pause;
    /** */
    constructor(pause?: number);
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
