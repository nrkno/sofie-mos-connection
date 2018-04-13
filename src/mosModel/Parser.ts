import * as XMLBuilder from 'xmlbuilder'
import {
	IMOSRunningOrder,
	IMOSROStory,
	IMOSItem,
	IMOSObjectPathType,
	IMOSObjectPath
} from '../api'
import { IMOSExternalMetaData } from '../dataTypes/mosExternalMetaData'
import * as parser from 'xml2json'
export namespace Parser {

	export function xml2RO (xml: XMLBuilder.XMLElementOrXMLNode): IMOSRunningOrder {
	}
	export function ro2xml (ro: IMOSRunningOrder): XMLBuilder.XMLElementOrXMLNode {
	}
	export function xml2Story (xml: XMLBuilder.XMLElementOrXMLNode): IMOSROStory {
	}
	export function story2xml (story: IMOSROStory): XMLBuilder.XMLElementOrXMLNode {
		let xmlStory = XMLBuilder.create('story')

		xmlStory.ele('storyID', {}, story.ID)
		// if (story.Slug) xmlStory.ele('storySlug', {}, story.)
		if (story.Slug) xmlStory.ele('storySlug', {}, story.Slug)
		if (story.Number) xmlStory.ele('storyNum', {}, story.Number)

		if (story.MosExternalMetaData) {
			story.MosExternalMetaData.forEach((md: IMOSExternalMetaData) => {
				let xmlMD = metaData2xml(md)
				xmlStory.importDocument(xmlMD)
			}
		}
		story.Items.forEach((item: IMOSItem) => {
			let xmlItem = item2xml(item)
			xmlStory.importDocument(xmlItem)
		})
		return xmlStory
	}
	export function xml2Item (xml: XMLBuilder.XMLElementOrXMLNode): IMOSItem {
	}
	export function item2xml (item: IMOSItem): XMLBuilder.XMLElementOrXMLNode {
		let xmlItem = XMLBuilder.create('item')
		xmlItem.ele('itemID', {}, item.ID)
		if (item.Slug) 					xmlItem.ele('itemSlug', {}, item.Slug)
		xmlItem.ele('objID', {}, item.ObjectID)
		xmlItem.ele('mosID', {}, item.MOSID)
		if (item.mosAbstract) 			xmlItem.ele('mosAbstract', {}, item.mosAbstract)

		if (item.Paths) {
			let xmlObjPaths = xmlItem.ele('objPaths')
			item.Paths.forEach((path: IMOSObjectPath) => {
				if (path.Type === IMOSObjectPathType.PATH) {
					xmlObjPaths.ele('objPath', {
						techDescription: path.Description
					}, path.Target)
				} else if (path.Type === IMOSObjectPathType.PROXY_PATH) {
					xmlObjPaths.ele('objProxyPath', {
						techDescription: path.Description
					}, path.Target)
				} else if (path.Type === IMOSObjectPathType.METADATA_PATH) {
					xmlObjPaths.ele('objMetadataPath ', {
						techDescription: path.Description
					}, path.Target)
				}
			})
		}
		//  objPaths?
		// 	  objPath*
		// 	  objProxyPath*
		// 	  objMetadataPath*

		if (item.Channel) 				xmlItem.ele('itemChannel', {}, item.Channel)
		if (item.EditorialStart) 		xmlItem.ele('itemEdStart', {}, item.EditorialStart)
		if (item.EditorialDuration) 	xmlItem.ele('itemEdDur', {}, item.EditorialDuration)
		if (item.UserTimingDuration) 	xmlItem.ele('itemUserTimingDur', {}, item.UserTimingDuration)
		if (item.Trigger) 				xmlItem.ele('itemTrigger', {}, item.Trigger)
		if (item.MacroIn) 				xmlItem.ele('macroIn', {}, item.MacroIn)
		if (item.MacroOut) 				xmlItem.ele('macroOut', {}, item.MacroOut)
		// TODO: mosExternalMetadata*
		return xmlItem
	}
	export function xml2MetaData (xml: XMLBuilder.XMLElementOrXMLNode): IMOSExternalMetaData {
	}
	export function metaData2xml (md: IMOSExternalMetaData): XMLBuilder.XMLElementOrXMLNode {
		let xmlMD = XMLBuilder.create('mosExternalMetadata')

		if (md.MosScope) xmlMD.ele('mosScope', {}, md.MosScope)
		xmlMD.ele('mosSchema', {}, md.MosSchema)
		
		let payload = parser.toXml(md.MosPayload)  // TODO: implement this properly, convert to xml
		xmlMD.ele('mosPayload', {}, payload)
		return xmlMD
	}
}