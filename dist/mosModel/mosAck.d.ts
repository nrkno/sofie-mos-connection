import * as XMLBuilder from 'xmlbuilder';
import { MosString128 } from './../dataTypes/mosString128';
import { MosMessage } from './MosMessage';
import { IMOSAck, IMOSAckStatus } from '../api';
export declare class MOSAck extends MosMessage implements IMOSAck {
    ID: MosString128;
    Revision: Number;
    Status: IMOSAckStatus;
    Description: MosString128;
    /** */
    constructor();
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
