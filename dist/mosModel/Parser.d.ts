import * as XMLBuilder from 'xmlbuilder';
import { IMOSRunningOrder, IMOSROStory, IMOSItem, IMOSObjectPath, IMOSRunningOrderBase, IMOSObject, IMOSROFullStory, IMOSROFullStoryBodyItem } from '../api';
import { IMOSExternalMetaData } from '../dataTypes/mosExternalMetaData';
import { MosString128 } from '../dataTypes/mosString128';
import { ROAck } from '../mosModel/ROAck';
export declare namespace Parser {
    function xml2ROBase(xml: any): IMOSRunningOrderBase;
    function xml2RO(xml: any): IMOSRunningOrder;
    function xml2Stories(xml: Array<any>): Array<IMOSROStory>;
    function xml2FullStory(xml: any): IMOSROFullStory;
    function xml2Story(xml: any): IMOSROStory;
    function story2xml(story: IMOSROStory): XMLBuilder.XMLElementOrXMLNode;
    function xml2Items(xml: Array<any>): Array<IMOSItem>;
    function xml2Item(xml: any): IMOSItem;
    function xml2ObjPaths(xml: any): Array<IMOSObjectPath>;
    function objPaths2xml(paths: Array<IMOSObjectPath>): XMLBuilder.XMLElementOrXMLNode;
    function item2xml(item: IMOSItem): XMLBuilder.XMLElementOrXMLNode;
    function xml2MetaData(xml: any): Array<IMOSExternalMetaData>;
    function metaData2xml(md: IMOSExternalMetaData): XMLBuilder.XMLElementOrXMLNode;
    function xml2IDs(xml: any): Array<MosString128>;
    function xml2ROAck(xml: any): ROAck;
    function xml2MosObjs(xml: any): Array<IMOSObject>;
    function xml2MosObj(xml: any): IMOSObject;
    function mosObj2xml(obj: IMOSObject): XMLBuilder.XMLElementOrXMLNode;
    function xml2Body(xml: any): Array<IMOSROFullStoryBodyItem>;
}
