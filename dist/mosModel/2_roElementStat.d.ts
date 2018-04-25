import * as XMLBuilder from 'xmlbuilder';
import { MosMessage } from './MosMessage';
import { MosString128 } from '../dataTypes/mosString128';
import { IMOSObjectStatus } from '../api';
export declare enum ROElementStatType {
    RO = "RO",
    STORY = "STORY",
    ITEM = "ITEM",
}
export interface ROElementStatOptions {
    type: ROElementStatType;
    roId: MosString128;
    storyId?: MosString128;
    itemId?: MosString128;
    objId?: MosString128;
    itemChannel?: MosString128;
    status: IMOSObjectStatus;
}
export declare class ROElementStat extends MosMessage {
    private options;
    private time;
    /** */
    constructor(options: ROElementStatOptions);
    /** */
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
