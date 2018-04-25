import * as XMLBuilder from 'xmlbuilder';
import { MosString128 } from './../dataTypes/mosString128';
import { MosMessage } from './MosMessage';
import { IMOSROAck, IMOSROAckStory } from '../api';
export declare class ROAck extends MosMessage implements IMOSROAck {
    ID: MosString128;
    Status: MosString128;
    Stories: Array<IMOSROAckStory>;
    /** */
    constructor();
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
