import * as XMLBuilder from 'xmlbuilder';
import { MosTime } from './../dataTypes/mosTime';
import { MosMessage } from './MosMessage';
export declare class HeartBeat extends MosMessage {
    time: MosTime;
    /** */
    constructor(time?: MosTime);
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
