import * as XMLBuilder from 'xmlbuilder';
export interface IMOSExternalMetaData {
    MosScope?: IMOSScope;
    MosSchema: string;
    MosPayload: any;
}
export declare enum IMOSScope {
    OBJECT = "OBJECT",
    STORY = "STORY",
    PLAYLIST = "PLAYLIST",
}
export declare class MosExternalMetaData {
    private _scope?;
    private _schema;
    private _payload;
    constructor(obj: IMOSExternalMetaData);
    readonly scope: IMOSScope | undefined;
    readonly schema: string;
    readonly payload: any;
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
