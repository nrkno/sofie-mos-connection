import * as XMLBuilder from 'xmlbuilder'
import {
	IMOSRunningOrder,
	IMOSROStory,
	IMOSItem,
	IMOSObjectPathType,
	IMOSObjectPath,
	IMOSRunningOrderBase,
	IMOSROAckStory,
	IMOSROAckItem,
	IMOSROAckObject
} from '../api'
import { IMOSExternalMetaData } from '../dataTypes/mosExternalMetaData'
import { MosString128 } from '../dataTypes/mosString128'
import { MosTime } from '../dataTypes/mosTime'
import { MosDuration } from '../dataTypes/mosDuration'
import * as parser from 'xml2json'
import { ROAck } from '../mosModel/ROAck'
export namespace Parser {

	export function xml2ROBase (xml: any): IMOSRunningOrderBase {
		let ro: IMOSRunningOrderBase = {
			ID: new MosString128(xml.roID),
			Slug: new MosString128(xml.roSlug)
		}

		if (xml.hasOwnProperty('roEdStart')) ro.EditorialStart = new MosTime(xml.roEdStart)
		if (xml.hasOwnProperty('roEdDur')) ro.EditorialDuration = new MosDuration(xml.roEdDur)
		if (xml.hasOwnProperty('mosExternalMetadata')) {
			// TODO: Handle an array of mosExternalMetadata
			let meta: IMOSExternalMetaData = {
				MosSchema: xml.mosExternalMetadata.mosSchema,
				MosPayload: xml.mosExternalMetadata.mosPayload
			}
			if (xml.mosExternalMetadata.hasOwnProperty('mosScope')) meta.MosScope = xml.mosExternalMetadata.mosScope
			ro.MosExternalMetaData = [meta]
		}
		// TODO: Add & test DefaultChannel, Trigger, MacroIn, MacroOut
		return ro
	}
	export function xml2RO (xml: any): IMOSRunningOrder {
		let stories: Array<IMOSROStory> = xml2Stories(xml.story)
		let ro: IMOSRunningOrder = xml2ROBase(xml) as IMOSRunningOrder
		ro.Stories = stories
		return ro
	}
	// export function ro2xml (ro: IMOSRunningOrder): XMLBuilder.XMLElementOrXMLNode {
	// 	// too implement
	// 	return XMLBuilder.create('ro')
	// }
	export function xml2Stories (xml: Array<any>): Array<IMOSROStory> {
		let xmlStories: Array<any> = xml
		if (!Array.isArray(xmlStories)) xmlStories = [xmlStories]

		return xmlStories.map((xmlStory: any) => {
			return xml2Story(xmlStory)
		})
	}
	export function xml2Story (xml: any): IMOSROStory {
		let story: IMOSROStory = {
			ID: new MosString128(xml.storyID),
			Slug: new MosString128(xml.storySlug),
			Items: []
			// TODO: Add & test Number, MosExternalMetaData, Items, ObjectID, MOSID, mosAbstract, Paths
			// Channel, EditorialStart, EditorialDuration, UserTimingDuration, Trigger, MacroIn, MacroOut, MosExternalMetaData
		}

		if (xml.item instanceof Array) {
			xml.item.forEach((xmlItem: any) => {
				story.Items.push(xml2Item(xmlItem))
			})
		} else if (xml.item) {
			story.Items.push(xml2Item(xml.item))
		}
		if (xml.hasOwnProperty('storyNum')) story.Number = new MosString128(xml.storyNum)
		if (xml.hasOwnProperty('MosExternalMetaData')) {
			// TODO: Handle an array of MosExternalMetaData
			let meta: IMOSExternalMetaData = {
				MosSchema: xml.MosExternalMetaData.mosSchema,
				MosPayload: xml.MosExternalMetaData.mosPayload
			}
			if (xml.MosExternalMetaData.hasOwnProperty('mosScope')) meta.MosScope = xml.MosExternalMetaData.mosScope
			story.MosExternalMetaData = [meta]
		}
		return story
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
			})
		}
		story.Items.forEach((item: IMOSItem) => {
			let xmlItem = item2xml(item)
			xmlStory.importDocument(xmlItem)
		})
		return xmlStory
	}
	export function xml2Items (xml: Array<any>): Array<IMOSItem> {
		let xmlItems: Array<any> = xml
		if (!Array.isArray(xmlItems)) xmlItems = [xmlItems]

		return xmlItems.map((xmlItem: any) => {
			return xml2Item(xmlItem)
		})
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
			let paths: Array<IMOSObjectPath> = []

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
			let meta: IMOSExternalMetaData = {
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
	// export function xml2MetaData (xml: XMLBuilder.XMLElementOrXMLNode): IMOSExternalMetaData {
	// 	// TODO: implement
	// }
	export function metaData2xml (md: IMOSExternalMetaData): XMLBuilder.XMLElementOrXMLNode {
		let xmlMD = XMLBuilder.create('mosExternalMetadata')

		if (md.MosScope) xmlMD.ele('mosScope', {}, md.MosScope)
		xmlMD.ele('mosSchema', {}, md.MosSchema)

		let payload = parser.toXml(md.MosPayload)  // TODO: implement this properly, convert to xml
		xmlMD.ele('mosPayload', {}, payload)
		return xmlMD
	}
	export function xml2IDs (xml: any): Array<MosString128> {
		let arr: Array<MosString128> = []
		let xmlIds: Array<string> = xml
		if (!Array.isArray(xmlIds)) xmlIds = [xmlIds]
		xmlIds.forEach((id: string) => {
			arr.push(new MosString128(id))
		})

		return arr
	}
	export function xml2ROAck (xml: any): ROAck {
		let roAck: ROAck = new ROAck()

		roAck.ID 		= new MosString128(xml.roID)
		roAck.Status 	= new MosString128(xml.roStatus)

		let xmlStoryIDs = xml.storyID
		let xmlItemIDs = xml.itemID
		let xmlObjIDs = xml.objID
		let xmlStatuses = xml.status

		if (!Array.isArray(xmlStoryIDs)) xmlStoryIDs = [xmlStoryIDs]
		if (!Array.isArray(xmlItemIDs)) xmlItemIDs = [xmlItemIDs]
		if (!Array.isArray(xmlObjIDs)) xmlObjIDs = [xmlObjIDs]
		if (!Array.isArray(xmlStatuses)) xmlStatuses = [xmlStatuses]

		roAck.Stories 	= []

		let iMax = Math.max(xmlStoryIDs.length,xmlItemIDs.length,xmlObjIDs.length,xmlStatuses.length)

		let story: IMOSROAckStory | null = null
		let item: IMOSROAckItem | null = null
		let object: IMOSROAckObject | null = null
		for (let i = 0; i < iMax; i++) {
			if (xmlStoryIDs[i]) {
				story = {
					ID: new MosString128(xmlStoryIDs[i]),
					Items: []
				}
				roAck.Stories.push(story)
			}
			if (xmlItemIDs[i]) {
				item = {
					ID: new MosString128(xmlStoryIDs[i]),
					Channel: new MosString128(''),
					Objects: []
				}
				if (story) story.Items.push(item)
			}
			if (xmlObjIDs[i] && xmlStatuses[i]) {
				object = {
					Status: xmlStatuses[i]
				}
				if (item) item.Objects.push(object)
			}
		}

		return roAck
	}
}
