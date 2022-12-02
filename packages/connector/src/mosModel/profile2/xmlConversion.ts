import * as XMLBuilder from 'xmlbuilder'
import {
	IMOSROStory,
	IMOSExternalMetaData,
	IMOSObjectPath,
	IMOSObjectPathType,
	IMOSItem,
	IMOSROFullStory,
	IMOSRunningOrderBase,
	IMOSRunningOrder,
	IMOSROAckStory,
	IMOSROAckItem,
	IMOSROAckObject,
} from '@mos-connection/model'
import { addTextElement } from '../../utils/Utils'
import { AnyXML, has, isEmpty, numberOrUndefined } from '../lib'
import { MosTime } from '../../dataTypes/mosTime'
import { MosDuration } from '../../dataTypes/mosDuration'
import { MosString128 } from '../../dataTypes/mosString128'
import { ROAck } from './ROAck'
import { XMLMosObjects } from '../profile1/xmlConversion'
/* eslint-disable @typescript-eslint/no-namespace */

export namespace XMLMosROAck {
	export function fromXML(xml: AnyXML): ROAck {
		const roAck: ROAck = new ROAck({
			ID: new MosString128(xml.roID),
			Status: new MosString128(xml.roStatus),
			Stories: [],
		})

		let xmlStoryIDs = xml.storyID
		let xmlItemIDs = xml.itemID
		let xmlObjIDs = xml.objID
		let xmlStatuses = xml.status

		if (!Array.isArray(xmlStoryIDs)) xmlStoryIDs = [xmlStoryIDs]
		if (!Array.isArray(xmlItemIDs)) xmlItemIDs = [xmlItemIDs]
		if (!Array.isArray(xmlObjIDs)) xmlObjIDs = [xmlObjIDs]
		if (!Array.isArray(xmlStatuses)) xmlStatuses = [xmlStatuses]

		roAck.Stories = []

		const iMax = Math.max(xmlStoryIDs.length, xmlItemIDs.length, xmlObjIDs.length, xmlStatuses.length)

		let story: IMOSROAckStory | null = null
		let item: IMOSROAckItem | null = null
		let object: IMOSROAckObject | null = null
		for (let i = 0; i < iMax; i++) {
			if (xmlStoryIDs[i]) {
				story = {
					ID: new MosString128(xmlStoryIDs[i]),
					Items: [],
				}
				roAck.Stories.push(story)
			}
			if (xmlItemIDs[i]) {
				item = {
					ID: new MosString128(xmlStoryIDs[i]),
					Channel: new MosString128(''),
					Objects: [],
				}
				if (story) story.Items.push(item)
			}
			if (xmlObjIDs[i] && xmlStatuses[i]) {
				object = {
					Status: xmlStatuses[i],
				}
				if (item) item.Objects.push(object)
			}
		}

		return roAck
	}
}
export namespace XMLRunningOrderBase {
	export function fromXML(xml: AnyXML): IMOSRunningOrderBase {
		const ro: IMOSRunningOrderBase = {
			ID: new MosString128(xml.roID),
			Slug: new MosString128(xml.roSlug),
		}

		if (has(xml, 'roEdStart') && !isEmpty(xml.roEdStart)) ro.EditorialStart = new MosTime(xml.roEdStart)
		if (has(xml, 'roEdDur') && !isEmpty(xml.roEdDur)) ro.EditorialDuration = new MosDuration(xml.roEdDur)
		if (has(xml, 'roChannel') && !isEmpty(xml.roChannel)) ro.DefaultChannel = new MosString128(xml.roChannel)
		if (has(xml, 'roTrigger') && !isEmpty(xml.roTrigger)) ro.Trigger = new MosString128(xml.roTrigger)
		if (has(xml, 'macroIn') && !isEmpty(xml.macroIn)) ro.MacroIn = new MosString128(xml.macroIn)
		if (has(xml, 'macroOut') && !isEmpty(xml.macroOut)) ro.MacroOut = new MosString128(xml.macroOut)
		if (has(xml, 'mosExternalMetadata') && !isEmpty(xml.mosExternalMetadata)) {
			// TODO: Handle an array of mosExternalMetadata
			const meta: IMOSExternalMetaData = {
				MosSchema: xml.mosExternalMetadata.mosSchema,
				MosPayload: xml.mosExternalMetadata.mosPayload,
			}
			if (has(xml.mosExternalMetadata, 'mosScope')) meta.MosScope = xml.mosExternalMetadata.mosScope
			ro.MosExternalMetaData = [meta]
		}
		return ro
	}
	export function toXML(xmlRo: XMLBuilder.XMLElement, ro: IMOSRunningOrderBase): void {
		addTextElement(xmlRo, 'roID', ro.ID)
		addTextElement(xmlRo, 'roSlug', ro.Slug)
		if (ro.DefaultChannel) addTextElement(xmlRo, 'roChannel', ro.DefaultChannel)
		if (ro.EditorialStart) addTextElement(xmlRo, 'roEdStart', ro.EditorialStart)
		if (ro.EditorialDuration) addTextElement(xmlRo, 'roEdDur', ro.EditorialDuration)
		if (ro.Trigger) addTextElement(xmlRo, 'roTrigger', ro.Trigger)
		if (ro.MacroIn) addTextElement(xmlRo, 'macroIn', ro.MacroIn)
		if (ro.MacroOut) addTextElement(xmlRo, 'macroOut', ro.MacroOut)
		XMLMosExternalMetaData.toXML(xmlRo, ro.MosExternalMetaData)
	}
}
export namespace XMLRunningOrder {
	export function fromXML(xml: AnyXML): IMOSRunningOrder {
		const stories: Array<IMOSROStory> = XMLROStories.fromXML(xml.story)
		const ro: IMOSRunningOrder = {
			...XMLRunningOrderBase.fromXML(xml),
			Stories: stories,
		}
		return ro
	}
}
export namespace XMLROStories {
	export function fromXML(xml: Array<any>): IMOSROStory[] {
		if (!xml) return []
		let xmlStories: Array<any> = xml
		if (!Array.isArray(xmlStories)) xmlStories = [xmlStories]

		return xmlStories.map((xmlStory: any) => {
			return XMLROStory.fromXML(xmlStory)
		})
	}
}
export namespace XMLROStoryBase {
	export function toXML(xmlStory: XMLBuilder.XMLElement, story: IMOSROStory | IMOSROFullStory): void {
		addTextElement(xmlStory, 'storyID', story.ID)
		if (story.Slug) addTextElement(xmlStory, 'storySlug', story.Slug)
		if (story.Number) addTextElement(xmlStory, 'storyNum', story.Number)
		XMLMosExternalMetaData.toXML(xmlStory, story.MosExternalMetaData)
	}
}
export namespace XMLROStory {
	export function fromXML(xml: AnyXML): IMOSROStory {
		const story: IMOSROStory = {
			ID: new MosString128(xml.storyID),
			Slug: new MosString128(xml.storySlug),
			Items: [],
			// TODO: Add & test Number, ObjectID, MOSID, mosAbstract, Paths
			// Channel, EditorialStart, EditorialDuration, UserTimingDuration, Trigger, MacroIn, MacroOut, MosExternalMetaData
			// MosExternalMetaData: MOSExternalMetaData.fromXML(xml.mosExternalMetadata)
		}
		if (has(xml, 'item')) story.Items = story.Items.concat(XMLMosItems.fromXML(xml.item))
		if (has(xml, 'storyBody') && xml.storyBody) {
			// Note: the <storyBody> is sent in roStorySend
			if (has(xml.storyBody, 'storyItem')) {
				story.Items = story.Items.concat(XMLMosItems.fromXML(xml.storyBody.storyItem))
			}
		}

		if (has(xml, 'mosExternalMetadata'))
			story.MosExternalMetaData = XMLMosExternalMetaData.fromXML(xml.mosExternalMetadata)

		if (has(xml, 'storyNum') && !isEmpty(xml.storyNum)) story.Number = new MosString128(xml.storyNum || '')

		return story
	}
	export function toXML(xmlRoot: XMLBuilder.XMLElement, story: IMOSROStory): void {
		const xmlStory = addTextElement(xmlRoot, 'story')
		XMLROStoryBase.toXML(xmlStory, story)
		story.Items.forEach((item: IMOSItem) => {
			XMLMosItem.toXML(xmlStory, item)
		})
	}
}
export namespace XMLMosItems {
	export function fromXML(xml: Array<any>): Array<IMOSItem> {
		if (!xml) return []
		let xmlItems: Array<any> = xml
		if (!Array.isArray(xmlItems)) xmlItems = [xmlItems]

		return xmlItems.map((xmlItem: any) => {
			return XMLMosItem.fromXML(xmlItem)
		})
	}
}
export namespace XMLMosItem {
	export function fromXML(xml: AnyXML): IMOSItem {
		const item: IMOSItem = {
			ID: new MosString128(xml.itemID),
			ObjectID: new MosString128(xml.objID),
			MOSID: xml.mosID,
			// TODO: mosAbstract?: string,
			// TODO: Channel?: MosString128,
			// TODO: MacroIn?: MosString128,
			// TODO: MacroOut?: MosString128,
		}

		if (has(xml, 'itemSlug') && !isEmpty(xml.itemSlug)) item.Slug = new MosString128(xml.itemSlug)
		if (has(xml, 'objPaths')) item.Paths = XMLObjectPaths.fromXML(xml.objPaths)
		if (has(xml, 'itemEdStart')) item.EditorialStart = numberOrUndefined(xml.itemEdStart)
		if (has(xml, 'itemEdDur')) item.EditorialDuration = numberOrUndefined(xml.itemEdDur)
		if (has(xml, 'itemUserTimingDur')) item.UserTimingDuration = numberOrUndefined(xml.itemUserTimingDur)
		if (has(xml, 'itemTrigger')) item.Trigger = xml.itemTrigger
		if (has(xml, 'mosExternalMetadata'))
			item.MosExternalMetaData = XMLMosExternalMetaData.fromXML(xml.mosExternalMetadata)
		if (has(xml, 'mosAbstract')) item.mosAbstract = xml.mosAbstract + ''
		if (has(xml, 'objSlug')) item.ObjectSlug = new MosString128(xml.objSlug, false) // temporary fix for long slugs
		if (has(xml, 'itemChannel')) item.Channel = new MosString128(xml.itemChannel)
		if (has(xml, 'objDur')) item.Duration = numberOrUndefined(xml.objDur)
		if (has(xml, 'objTB')) item.TimeBase = numberOrUndefined(xml.objTB)

		if (has(xml, 'macroIn')) item.MacroIn = new MosString128(xml.macroIn)
		if (has(xml, 'macroOut')) item.MacroOut = new MosString128(xml.macroOut)

		if (has(xml, 'mosObj')) {
			// Note: the <mosObj> is sent in roStorySend
			item.MosObjects = XMLMosObjects.fromXML(xml.mosObj)
		}

		return item
	}
	export function toXML(root: XMLBuilder.XMLElement, item: IMOSItem): void {
		const xmlItem = addTextElement(root, 'item')
		addTextElement(xmlItem, 'itemID', item.ID)
		addTextElement(xmlItem, 'objID', item.ObjectID)
		addTextElement(xmlItem, 'mosID', item.MOSID)

		if (item.Slug) addTextElement(xmlItem, 'itemSlug', item.Slug)
		if (item.ObjectSlug) addTextElement(xmlItem, 'objSlug', item.ObjectSlug)
		if (item.Duration) addTextElement(xmlItem, 'objDur', item.Duration)
		if (item.TimeBase) addTextElement(xmlItem, 'objTB', item.TimeBase)
		if (item.mosAbstract) addTextElement(xmlItem, 'mosAbstract', item.mosAbstract)
		if (item.Channel) addTextElement(xmlItem, 'itemChannel', item.Channel)
		if (item.EditorialStart !== undefined) addTextElement(xmlItem, 'itemEdStart', item.EditorialStart)
		if (item.EditorialDuration !== undefined) addTextElement(xmlItem, 'itemEdDur', item.EditorialDuration)
		if (item.UserTimingDuration !== undefined) addTextElement(xmlItem, 'itemUserTimingDur', item.UserTimingDuration)
		if (item.Trigger) addTextElement(xmlItem, 'itemTrigger', item.Trigger)
		if (item.MacroIn) addTextElement(xmlItem, 'macroIn', item.MacroIn)
		if (item.MacroOut) addTextElement(xmlItem, 'macroOut', item.MacroOut)
		XMLMosExternalMetaData.toXML(xmlItem, item.MosExternalMetaData)
		XMLObjectPaths.toXML(xmlItem, item.Paths)
	}
}
export namespace XMLMosExternalMetaData {
	export function fromXML(xml: AnyXML): IMOSExternalMetaData[] {
		if (!xml) return []
		let xmlMetadata: Array<any> = xml as any
		if (!Array.isArray(xml)) xmlMetadata = [xmlMetadata]
		return xmlMetadata.map((xmlmd) => {
			const md: IMOSExternalMetaData = {
				MosScope: has(xmlmd, 'mosScope') ? xmlmd.mosScope : null,
				MosSchema: xmlmd.mosSchema + '',
				MosPayload: _fixPayload(xmlmd.mosPayload),
			}
			return md
		})
	}

	export function toXML(xml: XMLBuilder.XMLElement, metadatas?: IMOSExternalMetaData[]): void {
		if (metadatas) {
			metadatas.forEach((metadata) => {
				const xmlMetadata = XMLBuilder.create({
					mosExternalMetadata: {
						mosSchema: metadata.MosSchema,
						mosPayload: metadata.MosPayload,
						mosScope: metadata.MosScope,
					},
				})
				xml.importDocument(xmlMetadata)
			})
		}
	}
}
function _handlePayloadProperties(prop: any): any {
	// prop is string, can be a mis-typing of number - if it contains numbers and comma
	// strings with numbers and , grouped will trigger
	if (prop && typeof prop === 'string' && prop.match(/[0-9]+[,][0-9]+/)) {
		// here is the fix for replacing and casting
		const commaCast = prop.replace(/,/, '.')
		const floatCast = parseFloat(commaCast)

		// ensure that the float hasn't changed value or content by checking it in reverse before returning the altered one
		if (floatCast.toString() === commaCast) {
			return floatCast
		}
	}

	// return the original content if we failed to identify and mutate the content
	return prop
}
function _fixPayload(obj: any): any {
	if (typeof obj === 'object') {
		for (const key in obj) {
			const o = obj[key]
			if (typeof o === 'object') {
				if (isEmpty(o)) {
					obj[key] = ''
				} else {
					_fixPayload(o)
				}
			} else {
				// do property-check on certain props (like MediaTime)
				obj[key] = _handlePayloadProperties(o)
			}
		}
	} else {
		// do property-check on certain props (like MediaTime)
		obj = _handlePayloadProperties(obj)
	}
	return obj
}
export namespace XMLObjectPaths {
	export function fromXML(xml: AnyXML): IMOSObjectPath[] {
		if (!xml) return []
		const getType = (xml: AnyXML) => {
			let type: IMOSObjectPathType | null = null
			if (has(xml, 'objPath') || xml.$name === 'objPath') {
				type = IMOSObjectPathType.PATH
			} else if (has(xml, 'objProxyPath') || xml.$name === 'objProxyPath') {
				type = IMOSObjectPathType.PROXY_PATH
			} else if (has(xml, 'objMetadataPath') || xml.$name === 'objMetadataPath') {
				type = IMOSObjectPathType.METADATA_PATH
			}
			return type
		}
		const getDescription = (xml: AnyXML) => {
			return xml.techDescription || (xml.attributes ? xml.attributes.techDescription : '')
		}
		const getTarget = (xml: AnyXML) => {
			return xml.text || xml.$t
		}
		const getMosObjectPath = (element: any, key?: any) => {
			let type = getType(element)
			if (!type && key) {
				type = getType({ $name: key })
			}
			const target = getTarget(element)
			const description = getDescription(element)
			if (type && target) {
				return {
					Type: type,
					Description: description,
					Target: target,
				}
			}
			return undefined
		}
		const xmlToArray = (obj: any) => {
			let paths: Array<IMOSObjectPath> = []
			if (has(obj, 'techDescription')) {
				const mosObj = getMosObjectPath(obj)
				if (mosObj) {
					paths.push(mosObj)
				}
			} else {
				Object.keys(obj).forEach((key) => {
					const element = obj[key]
					if (Array.isArray(element)) {
						paths = paths.concat(xmlToArray(element))
					} else {
						const mosObj = getMosObjectPath(element, key)
						if (mosObj) {
							paths.push(mosObj)
						}
					}
				})
			}
			return paths
		}
		const xmlPaths = xmlToArray(xml)
		return xmlPaths
	}

	export function toXML(xmlItem: XMLBuilder.XMLElement, paths?: IMOSObjectPath[]): void {
		if (paths) {
			const xmlObjPaths = addTextElement(xmlItem, 'objPaths')
			paths.forEach((path: IMOSObjectPath) => {
				if (path.Type === IMOSObjectPathType.PATH) {
					addTextElement(xmlObjPaths, 'objPath', path.Target, {
						techDescription: path.Description,
					})
				} else if (path.Type === IMOSObjectPathType.PROXY_PATH) {
					addTextElement(xmlObjPaths, 'objProxyPath', path.Target, {
						techDescription: path.Description,
					})
				} else if (path.Type === IMOSObjectPathType.METADATA_PATH) {
					addTextElement(xmlObjPaths, 'objMetadataPath', path.Target, {
						techDescription: path.Description,
					})
				}
			})
		}
	}
}
