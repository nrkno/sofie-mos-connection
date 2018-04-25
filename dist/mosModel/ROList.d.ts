import * as XMLBuilder from 'xmlbuilder';
import { MosMessage } from './MosMessage';
import { IMOSRunningOrder } from '../api';
export declare class ROList extends MosMessage {
    RO: IMOSRunningOrder;
    /** */
    constructor();
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
