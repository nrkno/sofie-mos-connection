import * as XMLBuilder from 'xmlbuilder'
import {
	IMOSRunningOrder,
	IMOSROStory,
	IMOSItem,
	IMOSObjectPathType,
	IMOSObjectPath,
	IMosExternalMetaData
} from '../api'
import { IMOSExternalMetaData } from '../dataTypes/mosExternalMetaData'
import { MosString128 } from '../dataTypes/mosString128'
import * as parser from 'xml2json'
export namespace Parser {

	export function xml2RO (xml: XMLBuilder.XMLElementOrXMLNode): IMOSRunningOrder {
	}
	export function ro2xml (ro: IMOSRunningOrder): XMLBuilder.XMLElementOrXMLNode {
	}
	export function xml2Story (xml: Array<any>): Array<IMOSROStory> {
		let stories: Array<IMOSROStory> = []
		let items: Array<object> = []

		for (let i = 0; i < xml.length; i++) {
			// console.log(xml[i], 'is array?', xml[i].item instanceof Array)
			let story: IMOSROStory = {
				ID: new MosString128(xml[i].storyID),
				Slug: new MosString128(xml[i].storySlug),
				Items: []
				// TODO: Add & test Number, MosExternalMetaData, Items, ObjectID, MOSID, mosAbstract, Paths
				// Channel, EditorialStart, EditorialDuration, UserTimingDuration, Trigger, MacroIn, MacroOut, MosExternalMetaData
			}

			if (xml[i].item instanceof Array) {
				for (let j = 0; j < xml[i].item.length; j++) {
					story.Items.push(xml2Item(xml[i].item[j]))
				}
			} else {
				story.Items.push(xml2Item(xml[i].item))
			}
			if (xml[i].hasOwnProperty('storyNum')) story.Number = new MosString128(xml[i].storyNum)
			if (xml[i].hasOwnProperty('MosExternalMetaData')) {
				// TODO: Handle an array of MosExternalMetaData
				let meta: IMosExternalMetaData = {
					MosSchema: xml[i].MosExternalMetaData.mosSchema,
					MosPayload: xml[i].MosExternalMetaData.mosPayload
				}
				if (xml[i].MosExternalMetaData.hasOwnProperty('mosScope')) meta.MosScope = xml[i].MosExternalMetaData.mosScope
				ro.MosExternalMetaData = [meta]
			}
			stories.push(story)
		}

		return stories
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
	export function xml2Item (xml: any): IMOSItem {
		let item: IMOSItem = {
			ID: new MosString128(xml.itemID),
			ObjectID: new MosString128(xml.objID),
			MOSID: xml.mosID
			// TODO: mosAbstract?: string,
			// TODO: Channel?: MosString128,
			// TODO: MacroIn?: MosString128,
			// TODO: MacroOut?: MosString128,
		}

		if (xml.hasOwnProperty('itemSlug')) item.Slug = new MosString128(xml.itemSlug)
		if (xml.hasOwnProperty('objPaths')) {
			let objPaths = xml.objPaths
			let paths:Array<IMOSObjectPath> = []

			if (objPaths.hasOwnProperty('objPath')) {
				let path: IMOSObjectPath = {
					Type: IMOSObjectPathType.PATH,
					Description: objPaths.objPath.techDescription,
					Target: objPaths.objPath['$t']
				}
				paths.push(path)
			}
			if (objPaths.hasOwnProperty('objProxyPath')) {
				let path: IMOSObjectPath = {
					Type: IMOSObjectPathType.PROXY_PATH,
					Description: objPaths.objProxyPath.techDescription,
					Target: objPaths.objProxyPath['$t']
				}
				paths.push(path)
			}
			if (objPaths.hasOwnProperty('objMetadataPath')) {
				let path: IMOSObjectPath = {
					Type: IMOSObjectPathType.METADATA_PATH,
					Description: objPaths.objMetadataPath.techDescription,
					Target: objPaths.objMetadataPath['$t']
				}
				paths.push(path)
			}
			item.Paths = paths
		}
		if (xml.hasOwnProperty('itemEdStart')) item.EditorialStart = xml.itemEdStart
		if (xml.hasOwnProperty('itemEdDur')) item.EditorialDuration = xml.itemEdDur
		if (xml.hasOwnProperty('itemUserTimingDur')) item.UserTimingDuration = xml.itemUserTimingDur
		if (xml.hasOwnProperty('itemTrigger')) item.Trigger = xml.itemTrigger
		if (xml.hasOwnProperty('MosExternalMetaData')) {
			// TODO: Handle an array of MosExternalMetaData
			let meta: IMosExternalMetaData = {
				MosSchema: xml.MosExternalMetaData.mosSchema,
				MosPayload: xml.MosExternalMetaData.mosPayload
			}
			if (xml.MosExternalMetaData.hasOwnProperty('mosScope')) meta.MosScope = xml.MosExternalMetaData.mosScope
			item.MosExternalMetaData = [meta]
		}

		return item
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