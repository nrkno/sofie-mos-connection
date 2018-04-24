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
	IMOSROAckObject,
	IMOSObject,
	IMOSROFullStory
} from '../api'
import { IMOSExternalMetaData } from '../dataTypes/mosExternalMetaData'
import { MosString128 } from '../dataTypes/mosString128'
import { MosTime } from '../dataTypes/mosTime'
import { MosDuration } from '../dataTypes/mosDuration'
import * as parser from 'xml2json'
import { ROAck } from '../mosModel/ROAck'

function isEmpty (obj: any) {
	if (typeof obj === 'object') {
		for (let prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				return false
			}
		}
		return JSON.stringify(obj) === JSON.stringify({})
	} else {
		return !obj
	}
}
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
		if (!xml) return []
		let xmlStories: Array<any> = xml
		if (!Array.isArray(xmlStories)) xmlStories = [xmlStories]

		return xmlStories.map((xmlStory: any) => {
			return xml2Story(xmlStory)
		})
	}
	export function xml2FullStory (xml: any): IMOSROFullStory {
		let story: IMOSROFullStory = Object.assign({
			RunningOrderId: new MosString128(xml.roID),
			Body: xml2Body(xml.storyBody),
		}, xml2Story(xml));

		return story
	}
	export function xml2Story (xml: any): IMOSROStory {
		let story: IMOSROStory = {
			ID: new MosString128(xml.storyID),
			Slug: new MosString128(xml.storySlug),
			Items: []
			// TODO: Add & test Number, ObjectID, MOSID, mosAbstract, Paths
			// Channel, EditorialStart, EditorialDuration, UserTimingDuration, Trigger, MacroIn, MacroOut, MosExternalMetaData
			// MosExternalMetaData: xml2MetaData(xml.mosExternalMetadata)
		}
		if (xml.hasOwnProperty('item')) story.Items = story.Items.concat(xml2Items(xml.item))
		if (xml.hasOwnProperty('storyBody') && xml.storyBody) {
			// Note: the <storyBody> is sent in roStorySend
			if (xml.storyBody.hasOwnProperty('storyItem')) {
				story.Items = story.Items.concat(xml2Items(xml.storyBody.storyItem))
			}
		}

		if (xml.hasOwnProperty('mosExternalMetadata')) story.MosExternalMetaData = xml2MetaData(xml.mosExternalMetadata)

		if (xml.hasOwnProperty('storyNum') && !isEmpty(xml.storyNum)) story.Number = new MosString128(xml.storyNum || '')

		return story
	}
	export function story2xml (story: IMOSROStory): XMLBuilder.XMLElementOrXMLNode {
		let xmlStory = XMLBuilder.create('story')

		xmlStory.ele('storyID', {}, story.ID)
		// if (story.Slug) xmlStory.ele('storySlug', {}, story.)
		if (story.Slug) xmlStory.ele('storySlug', {}, story.Slug.toString())
		if (story.Number) xmlStory.ele('storyNum', {}, story.Number.toString())

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
		if (!xml) return []
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

		if (xml.hasOwnProperty('itemSlug') && !isEmpty(xml.itemSlug)) item.Slug = new MosString128(xml.itemSlug)
		if (xml.hasOwnProperty('objPaths')) item.Paths = xml2ObjPaths(xml.objPaths)
		if (xml.hasOwnProperty('itemEdStart')) item.EditorialStart = xml.itemEdStart
		if (xml.hasOwnProperty('itemEdDur')) item.EditorialDuration = xml.itemEdDur
		if (xml.hasOwnProperty('itemUserTimingDur')) item.UserTimingDuration = xml.itemUserTimingDur
		if (xml.hasOwnProperty('itemTrigger')) item.Trigger = xml.itemTrigger
		if (xml.hasOwnProperty('mosExternalMetadata')) item.MosExternalMetaData = xml2MetaData(xml.mosExternalMetadata)

		if (xml.hasOwnProperty('mosObj')) {
			// Note: the <mosObj> is sent in roStorySend
			item.MosObjects = xml2MosObjs(xml.mosObj)
		}

		return item
	}
	export function xml2ObjPaths (xml: any): Array<IMOSObjectPath> {
		if (!xml) return []
		let paths: Array<IMOSObjectPath> = []

		let xmlPaths: Array<{key: string, o: any}> = []
		Object.keys(xml).forEach((key) => {
			let arr: Array<any> = xml[key]
			if (!Array.isArray(arr)) arr = [arr]

			arr.forEach((o) => {
				xmlPaths.push({
					key: key,
					o: o
				})
			})
		})

		xmlPaths.forEach((xmlPath) => {
			let type: IMOSObjectPathType | null = null
			if (xmlPath.key === 'objPath') {
				type = IMOSObjectPathType.PATH
			} else if (xmlPath.key === 'objProxyPath') {
				type = IMOSObjectPathType.PROXY_PATH
			} else if (xmlPath.key === 'objMetadataPath') {
				type = IMOSObjectPathType.METADATA_PATH
			}
			if (type) {
				paths.push({
					Type: type,
					Description: xmlPath.o.techDescription,
					Target: xmlPath.o.$t
				})
			}
		})
		return paths
	}
	export function objPaths2xml (paths: Array<IMOSObjectPath>): XMLBuilder.XMLElementOrXMLNode {
		let xmlObjPaths = XMLBuilder.create('objPaths')
		paths.forEach((path: IMOSObjectPath) => {
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
		return xmlObjPaths
	}
	export function item2xml (item: IMOSItem): XMLBuilder.XMLElementOrXMLNode {
		let xmlItem = XMLBuilder.create('item')
		xmlItem.ele('itemID', {}, item.ID)
		if (item.Slug) 					xmlItem.ele('itemSlug', {}, item.Slug)
		xmlItem.ele('objID', {}, item.ObjectID)
		xmlItem.ele('mosID', {}, item.MOSID)
		if (item.mosAbstract) 			xmlItem.ele('mosAbstract', {}, item.mosAbstract)

		if (item.Paths) {
			let xmlObjPaths = objPaths2xml(item.Paths)
			xmlItem.importDocument(xmlObjPaths)
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
		if (item.MacroOut)				xmlItem.ele('mosExternalMetadata', {}, item.MacroOut)
		if (item.MosExternalMetaData) {
			item.MosExternalMetaData.forEach((md) => {
				let xmlMetaData = metaData2xml(md)
				xmlItem.importDocument(xmlMetaData)
			})
		}
		return xmlItem
	}
	export function xml2MetaData (xml: any): Array<IMOSExternalMetaData> {
		if (!xml) return []
		let xmlMetadata: Array<any> = xml
		if (!Array.isArray(xml)) xmlMetadata = [xmlMetadata]
		return xmlMetadata.map((xmlmd) => {
			let md: IMOSExternalMetaData = {
				MosScope: (xmlmd.hasOwnProperty('mosScope') ? xmlmd.mosScope : null),
				MosSchema: xmlmd.mosSchema + '',
				MosPayload: xmlmd.mosPayload
			}
			return md
		})
	}
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
	export function xml2MosObjs (xml: any ): Array<IMOSObject> {
		if (!xml) return []
		let xmlObjs: Array<any> = []
		xmlObjs = xml
		if (!Array.isArray(xmlObjs)) xmlObjs = [xmlObjs]

		return xmlObjs.map((xmlObj) => {
			return xml2MosObj(xmlObj)
		})
	}
	export function xml2MosObj (xml: any ): IMOSObject {
		let mosObj: IMOSObject = {
			ID: new MosString128(xml.objID),
			Slug: new MosString128(xml.objSlug),
			MosAbstract: xml.mosAbstract,
			Group: xml.objGroup,
			Type: xml.objType,
			TimeBase: xml.objTB,
			Revision: xml.objRev,
			Duration: xml.objDur,
			Status: xml.status,
			AirStatus: xml.objAir,
			Paths: xml2ObjPaths(xml.objPaths),
			CreatedBy: new MosString128(xml.createdBy),
			Created: new MosTime(xml.created),
			ChangedBy: new MosString128(xml.changedBy),
			Changed: new MosTime(xml.changed),
			Description: xml.description
		}
		if (xml.hasOwnProperty('mosExternalMetadata')) mosObj.MosExternalMetaData = xml2MetaData(xml.mosExternalMetadata)
		return mosObj
	}
	export function mosObj2xml (obj: IMOSObject): XMLBuilder.XMLElementOrXMLNode {
		let xml = XMLBuilder.create('mosObj')

		xml.ele('objID', {}, obj.ID)
		xml.ele('objSlug', {}, obj.Slug)
		if (obj.MosAbstract) 	xml.ele('mosAbstract', {}, obj.MosAbstract)
		if (obj.Group) 			xml.ele('objGroup', {}, obj.Group)
		xml.ele('objType', {}, obj.Type)
		xml.ele('objTB', {}, obj.TimeBase)
		xml.ele('objRev', {}, obj.Revision)
		xml.ele('objDur', {}, obj.Duration)
		xml.ele('status', {}, obj.Status)
		xml.ele('objAir', {}, obj.AirStatus)

		if (obj.Paths) {
			let xmlObjPaths = objPaths2xml(obj.Paths)
			xml.importDocument(xmlObjPaths)
		}

		xml.ele('createdBy', {}, obj.CreatedBy)
		xml.ele('created', {}, obj.Created)
		if (obj.ChangedBy) xml.ele('changedBy', {}, 	obj.ChangedBy)
		if (obj.Changed) xml.ele('changed', {}, 		obj.Changed)
		if (obj.Description) xml.ele('description', {}, 	obj.Description)
		if (obj.MosExternalMetaData) {
			obj.MosExternalMetaData.forEach((md) => {
				let xmlMetaData = metaData2xml(md)
				xml.importDocument(xmlMetaData)
			})
		}
		// Todo: metadata:
		return xml
	}
	export function xml2Body (xml: any): any {
		let body = {}
		console.log('xml2Body', xml)
		let elementKeys = Object.keys(xml)
		elementKeys.forEach((key) => {
			// let elements
		})
		return body
	}
}
