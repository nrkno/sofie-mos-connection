import * as XMLBuilder from 'xmlbuilder';
export declare abstract class MosMessage {
    private static MAX_MESSAGE_ID;
    private static _messageID;
    mosID: string;
    ncsID: string;
    port: string;
    private _messageID;
    private static getNewMessageID();
    /** */
    prepare(messageID?: number): void;
    /** */
    readonly messageID: number;
    /** */
    toString(): string;
    /** */
    protected readonly abstract messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
