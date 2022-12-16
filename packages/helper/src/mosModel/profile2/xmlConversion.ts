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
	getMosTypes,
} from '@mos-connection/model'
import { AnyXML, has, isEmpty, numberOrUndefined } from '../lib'
import { ROAck } from './ROAck'
import { XMLMosObjects } from '../profile1/xmlConversion'
import { addTextElementInternal } from '../../utils/Utils'
/* eslint-disable @typescript-eslint/no-namespace */

export namespace XMLMosROAck {
	export function fromXML(xml: AnyXML, strict: boolean): ROAck {
		const mosTypes = getMosTypes(strict)

		const roAck: ROAck = new ROAck(
			{
				ID: mosTypes.mosString128.create(xml.roID),
				Status: mosTypes.mosString128.create(xml.roStatus),
				Stories: [],
			},
			strict
		)

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
					ID: mosTypes.mosString128.create(xmlStoryIDs[i]),
					Items: [],
				}
				roAck.Stories.push(story)
			}
			if (xmlItemIDs[i]) {
				item = {
					ID: mosTypes.mosString128.create(xmlStoryIDs[i]),
					Channel: mosTypes.mosString128.create(''),
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
	export function fromXML(xml: AnyXML, strict: boolean): IMOSRunningOrderBase {
		const mosTypes = getMosTypes(strict)
		const ro: IMOSRunningOrderBase = {
			ID: mosTypes.mosString128.create(xml.roID),
			Slug: mosTypes.mosString128.create(xml.roSlug),
		}

		if (has(xml, 'roEdStart') && !isEmpty(xml.roEdStart)) ro.EditorialStart = mosTypes.mosTime.create(xml.roEdStart)
		if (has(xml, 'roEdDur') && !isEmpty(xml.roEdDur))
			ro.EditorialDuration = mosTypes.mosDuration.create(xml.roEdDur)
		if (has(xml, 'roChannel') && !isEmpty(xml.roChannel))
			ro.DefaultChannel = mosTypes.mosString128.create(xml.roChannel)
		if (has(xml, 'roTrigger') && !isEmpty(xml.roTrigger)) ro.Trigger = mosTypes.mosString128.create(xml.roTrigger)
		if (has(xml, 'macroIn') && !isEmpty(xml.macroIn)) ro.MacroIn = mosTypes.mosString128.create(xml.macroIn)
		if (has(xml, 'macroOut') && !isEmpty(xml.macroOut)) ro.MacroOut = mosTypes.mosString128.create(xml.macroOut)
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
	export function toXML(xmlRo: XMLBuilder.XMLElement, ro: IMOSRunningOrderBase, strict: boolean): void {
		addTextElementInternal(xmlRo, 'roID', ro.ID, undefined, strict)
		addTextElementInternal(xmlRo, 'roSlug', ro.Slug, undefined, strict)
		if (ro.DefaultChannel) addTextElementInternal(xmlRo, 'roChannel', ro.DefaultChannel, undefined, strict)
		if (ro.EditorialStart) addTextElementInternal(xmlRo, 'roEdStart', ro.EditorialStart, undefined, strict)
		if (ro.EditorialDuration) addTextElementInternal(xmlRo, 'roEdDur', ro.EditorialDuration, undefined, strict)
		if (ro.Trigger) addTextElementInternal(xmlRo, 'roTrigger', ro.Trigger, undefined, strict)
		if (ro.MacroIn) addTextElementInternal(xmlRo, 'macroIn', ro.MacroIn, undefined, strict)
		if (ro.MacroOut) addTextElementInternal(xmlRo, 'macroOut', ro.MacroOut, undefined, strict)
		XMLMosExternalMetaData.toXML(xmlRo, ro.MosExternalMetaData)
	}
}
export namespace XMLRunningOrder {
	export function fromXML(xml: AnyXML, strict: boolean): IMOSRunningOrder {
		const stories: Array<IMOSROStory> = XMLROStories.fromXML(xml.story, strict)
		const ro: IMOSRunningOrder = {
			...XMLRunningOrderBase.fromXML(xml, strict),
			Stories: stories,
		}
		return ro
	}
}
export namespace XMLROStories {
	export function fromXML(xml: Array<any>, strict: boolean): IMOSROStory[] {
		if (!xml) return []
		let xmlStories: Array<any> = xml
		if (!Array.isArray(xmlStories)) xmlStories = [xmlStories]

		return xmlStories.map((xmlStory: any) => {
			return XMLROStory.fromXML(xmlStory, strict)
		})
	}
}
export namespace XMLROStoryBase {
	export function toXML(
		xmlStory: XMLBuilder.XMLElement,
		story: IMOSROStory | IMOSROFullStory,
		strict: boolean
	): void {
		addTextElementInternal(xmlStory, 'storyID', story.ID, undefined, strict)
		if (story.Slug) addTextElementInternal(xmlStory, 'storySlug', story.Slug, undefined, strict)
		if (story.Number) addTextElementInternal(xmlStory, 'storyNum', story.Number, undefined, strict)
		XMLMosExternalMetaData.toXML(xmlStory, story.MosExternalMetaData)
	}
}
export namespace XMLROStory {
	export function fromXML(xml: AnyXML, strict: boolean): IMOSROStory {
		const mosTypes = getMosTypes(strict)
		const story: IMOSROStory = {
			ID: mosTypes.mosString128.create(xml.storyID),
			Slug: mosTypes.mosString128.create(xml.storySlug),
			Items: [],
			// TODO: Add & test Number, ObjectID, MOSID, mosAbstract, Paths
			// Channel, EditorialStart, EditorialDuration, UserTimingDuration, Trigger, MacroIn, MacroOut, MosExternalMetaData
			// MosExternalMetaData: MOSExternalMetaData.fromXML(xml.mosExternalMetadata)
		}
		if (has(xml, 'item')) story.Items = story.Items.concat(XMLMosItems.fromXML(xml.item, strict))
		if (has(xml, 'storyBody') && xml.storyBody) {
			// Note: the <storyBody> is sent in roStorySend
			if (has(xml.storyBody, 'storyItem')) {
				story.Items = story.Items.concat(XMLMosItems.fromXML(xml.storyBody.storyItem, strict))
			}
		}

		if (has(xml, 'mosExternalMetadata'))
			story.MosExternalMetaData = XMLMosExternalMetaData.fromXML(xml.mosExternalMetadata)

		if (has(xml, 'storyNum') && !isEmpty(xml.storyNum))
			story.Number = mosTypes.mosString128.create(xml.storyNum || '')

		return story
	}
	export function toXML(xmlRoot: XMLBuilder.XMLElement, story: IMOSROStory, strict: boolean): void {
		const xmlStory = addTextElementInternal(xmlRoot, 'story', undefined, undefined, strict)
		XMLROStoryBase.toXML(xmlStory, story, strict)
		story.Items.forEach((item: IMOSItem) => {
			XMLMosItem.toXML(xmlStory, item, strict)
		})
	}
}
export namespace XMLMosItems {
	export function fromXML(xml: Array<any>, strict: boolean): Array<IMOSItem> {
		if (!xml) return []
		let xmlItems: Array<any> = xml
		if (!Array.isArray(xmlItems)) xmlItems = [xmlItems]

		return xmlItems.map((xmlItem: any) => {
			return XMLMosItem.fromXML(xmlItem, strict)
		})
	}
}
export namespace XMLMosItem {
	export function fromXML(xml: AnyXML, strict: boolean): IMOSItem {
		const mosTypes = getMosTypes(strict)
		const item: IMOSItem = {
			ID: mosTypes.mosString128.create(xml.itemID),
			ObjectID: mosTypes.mosString128.create(xml.objID),
			MOSID: xml.mosID,
			// TODO: mosAbstract?: string,
			// TODO: Channel?: MosString128,
			// TODO: MacroIn?: MosString128,
			// TODO: MacroOut?: MosString128,
		}

		if (has(xml, 'itemSlug') && !isEmpty(xml.itemSlug)) item.Slug = mosTypes.mosString128.create(xml.itemSlug)
		if (has(xml, 'objPaths')) item.Paths = XMLObjectPaths.fromXML(xml.objPaths)
		if (has(xml, 'itemEdStart')) item.EditorialStart = numberOrUndefined(xml.itemEdStart)
		if (has(xml, 'itemEdDur')) item.EditorialDuration = numberOrUndefined(xml.itemEdDur)
		if (has(xml, 'itemUserTimingDur')) item.UserTimingDuration = numberOrUndefined(xml.itemUserTimingDur)
		if (has(xml, 'itemTrigger')) item.Trigger = xml.itemTrigger
		if (has(xml, 'mosExternalMetadata'))
			item.MosExternalMetaData = XMLMosExternalMetaData.fromXML(xml.mosExternalMetadata)
		if (has(xml, 'mosAbstract')) item.mosAbstract = xml.mosAbstract + ''
		if (has(xml, 'objSlug')) item.ObjectSlug = getMosTypes(false).mosString128.create(xml.objSlug) // temporary fix for long slugs
		if (has(xml, 'itemChannel')) item.Channel = mosTypes.mosString128.create(xml.itemChannel)
		if (has(xml, 'objDur')) item.Duration = numberOrUndefined(xml.objDur)
		if (has(xml, 'objTB')) item.TimeBase = numberOrUndefined(xml.objTB)

		if (has(xml, 'macroIn')) item.MacroIn = mosTypes.mosString128.create(xml.macroIn)
		if (has(xml, 'macroOut')) item.MacroOut = mosTypes.mosString128.create(xml.macroOut)

		if (has(xml, 'mosObj')) {
			// Note: the <mosObj> is sent in roStorySend
			item.MosObjects = XMLMosObjects.fromXML(xml.mosObj, strict)
		}

		return item
	}
	export function toXML(root: XMLBuilder.XMLElement, item: IMOSItem, strict: boolean): void {
		const xmlItem = addTextElementInternal(root, 'item', undefined, undefined, strict)
		addTextElementInternal(xmlItem, 'itemID', item.ID, undefined, strict)
		addTextElementInternal(xmlItem, 'objID', item.ObjectID, undefined, strict)
		addTextElementInternal(xmlItem, 'mosID', item.MOSID, undefined, strict)

		if (item.Slug) addTextElementInternal(xmlItem, 'itemSlug', item.Slug, undefined, strict)
		if (item.ObjectSlug) addTextElementInternal(xmlItem, 'objSlug', item.ObjectSlug, undefined, strict)
		if (item.Duration) addTextElementInternal(xmlItem, 'objDur', item.Duration, undefined, strict)
		if (item.TimeBase) addTextElementInternal(xmlItem, 'objTB', item.TimeBase, undefined, strict)
		if (item.mosAbstract) addTextElementInternal(xmlItem, 'mosAbstract', item.mosAbstract, undefined, strict)
		if (item.Channel) addTextElementInternal(xmlItem, 'itemChannel', item.Channel, undefined, strict)
		if (item.EditorialStart !== undefined)
			addTextElementInternal(xmlItem, 'itemEdStart', item.EditorialStart, undefined, strict)
		if (item.EditorialDuration !== undefined)
			addTextElementInternal(xmlItem, 'itemEdDur', item.EditorialDuration, undefined, strict)
		if (item.UserTimingDuration !== undefined)
			addTextElementInternal(xmlItem, 'itemUserTimingDur', item.UserTimingDuration, undefined, strict)
		if (item.Trigger) addTextElementInternal(xmlItem, 'itemTrigger', item.Trigger, undefined, strict)
		if (item.MacroIn) addTextElementInternal(xmlItem, 'macroIn', item.MacroIn, undefined, strict)
		if (item.MacroOut) addTextElementInternal(xmlItem, 'macroOut', item.MacroOut, undefined, strict)
		XMLMosExternalMetaData.toXML(xmlItem, item.MosExternalMetaData)
		XMLObjectPaths.toXML(xmlItem, item.Paths, strict)
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
	if (prop && typeof prop === 'string' && prop.match(/\d+,\d+/)) {
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

	export function toXML(xmlItem: XMLBuilder.XMLElement, paths: IMOSObjectPath[] | undefined, strict: boolean): void {
		if (paths) {
			const xmlObjPaths = addTextElementInternal(xmlItem, 'objPaths', undefined, undefined, strict)
			paths.forEach((path: IMOSObjectPath) => {
				if (path.Type === IMOSObjectPathType.PATH) {
					addTextElementInternal(
						xmlObjPaths,
						'objPath',
						path.Target,
						{
							techDescription: path.Description,
						},
						strict
					)
				} else if (path.Type === IMOSObjectPathType.PROXY_PATH) {
					addTextElementInternal(
						xmlObjPaths,
						'objProxyPath',
						path.Target,
						{
							techDescription: path.Description,
						},
						strict
					)
				} else if (path.Type === IMOSObjectPathType.METADATA_PATH) {
					addTextElementInternal(
						xmlObjPaths,
						'objMetadataPath',
						path.Target,
						{
							techDescription: path.Description,
						},
						strict
					)
				}
			})
		}
	}
}
