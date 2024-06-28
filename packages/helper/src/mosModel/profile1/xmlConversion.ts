import * as XMLBuilder from 'xmlbuilder'
import {
	IMOSRequestObjectList,
	IMOSObject,
	IMOSAck,
	IMOSAckStatus,
	IMOSObjectPath,
	IMOSObjectPathType,
	IMOSExternalMetaData,
} from '@mos-connection/model'
import { AnyXMLObject, has, isEmpty } from '../lib'
import { addTextElementInternal } from '../../utils/Utils'
import { getParseMosTypes } from '../parseMosTypes'

/* eslint-disable @typescript-eslint/no-namespace */
export namespace XMLMosAck {
	export function fromXML(xml: AnyXMLObject, strict: boolean): IMOSAck {
		const mosTypes = getParseMosTypes(strict)
		const ack: IMOSAck = {
			ID: mosTypes.mosString128.createRequired(xml.objID),
			Revision: typeof xml.objRev === 'number' ? xml.objRev : 0,
			Status: typeof xml.status === 'string' ? (xml.status as IMOSAckStatus) : IMOSAckStatus.ACK,
			Description: mosTypes.mosString128.createRequired(
				typeof xml.statusDescription === 'string' ? xml.statusDescription : ''
			),
		}
		return ack
	}
}
export namespace XMLMosObjects {
	export function fromXML(xml: AnyXMLObject, strict: boolean): Array<IMOSObject> {
		if (!xml) return []
		let xmlObjs = xml
		if (!Array.isArray(xmlObjs)) xmlObjs = [xmlObjs]

		return xmlObjs.map((xmlObj) => {
			return XMLMosObject.fromXML(xmlObj, strict)
		})
	}
	export function toXML(xml: XMLBuilder.XMLElement, objs: IMOSObject[] | undefined, strict: boolean): void {
		if (objs) {
			objs.forEach((MosObject) => {
				const xmlMosObj = XMLBuilder.create('mosObj')
				XMLMosObject.toXML(xmlMosObj, MosObject, strict)
				xml.importDocument(xmlMosObj)
			})
		}
	}
}
export namespace XMLMosObject {
	export function fromXML(xml: AnyXMLObject, strict: boolean): IMOSObject {
		const mosTypes = getParseMosTypes(strict)
		const mosObj: IMOSObject = {
			ID: mosTypes.mosString128.createRequired(xml.objID),
			Slug: mosTypes.mosString128.createRequired(xml.objSlug),
			MosAbstract: xml.mosAbstract,
			Group: xml.objGroup,
			Type: xml.objType,
			TimeBase: xml.objTB,
			Revision: xml.objRev,
			Duration: xml.objDur,
			Status: xml.status,
			AirStatus: xml.objAir,
			Paths: XMLObjectPaths.fromXML(xml.objPaths),
			CreatedBy: mosTypes.mosString128.createOptional(xml.createdBy),
			Created: mosTypes.mosTime.createOptional(xml.created),
			ChangedBy: mosTypes.mosString128.createOptional(xml.changedBy),
			Changed: mosTypes.mosTime.createOptional(xml.changed),
			Description: xml.description,
		}
		if (has(xml, 'mosExternalMetadata'))
			mosObj.MosExternalMetaData = XMLMosExternalMetaData.fromXML(xml.mosExternalMetadata)
		if (has(xml, 'mosItemEditorProgID'))
			mosObj.MosItemEditorProgID = mosTypes.mosString128.createOptional(xml.mosItemEditorProgID)
		return mosObj
	}
	export function toXML(xml: XMLBuilder.XMLElement, obj: IMOSObject, strict: boolean): void {
		if (obj.ID) addTextElementInternal(xml, 'objID', obj.ID, undefined, strict)
		addTextElementInternal(xml, 'objSlug', obj.Slug, undefined, strict)
		if (obj.MosAbstract) addTextElementInternal(xml, 'mosAbstract', obj.MosAbstract, undefined, strict)
		if (obj.Group) addTextElementInternal(xml, 'objGroup', obj.Group, undefined, strict)
		addTextElementInternal(xml, 'objType', obj.Type, undefined, strict)
		addTextElementInternal(xml, 'objTB', obj.TimeBase, undefined, strict)
		addTextElementInternal(xml, 'objRev', obj.Revision, undefined, strict)
		addTextElementInternal(xml, 'objDur', obj.Duration, undefined, strict)
		addTextElementInternal(xml, 'status', obj.Status, undefined, strict)
		addTextElementInternal(xml, 'objAir', obj.AirStatus, undefined, strict)

		if (obj.Paths) {
			XMLObjectPaths.toXML(xml, obj.Paths, strict)
		}

		addTextElementInternal(xml, 'createdBy', obj.CreatedBy, undefined, strict)
		addTextElementInternal(xml, 'created', obj.Created, undefined, strict)
		if (obj.ChangedBy) addTextElementInternal(xml, 'changedBy', obj.ChangedBy, undefined, strict)
		if (obj.Changed) addTextElementInternal(xml, 'changed', obj.Changed, undefined, strict)
		if (obj.Description) addTextElementInternal(xml, 'description', obj.Description, undefined, strict)
		XMLMosExternalMetaData.toXML(xml, obj.MosExternalMetaData)
	}
}
export namespace XMLMosRequestObjectList {
	export function fromXML(xml: AnyXMLObject): IMOSRequestObjectList {
		const list: IMOSRequestObjectList = {
			username: xml.username,
			queryID: xml.queryID,
			listReturnStart: xml.listReturnStart,
			listReturnEnd: xml.listReturnEnd,
			generalSearch: xml.generalSearch,
			mosSchema: xml.mosSchema,
			searchGroups: [],
		}

		if (typeof list.listReturnStart === 'object') list.listReturnStart = null
		if (typeof list.listReturnEnd === 'object') list.listReturnEnd = null

		for (const searchGroup of xml.searchGroup) {
			const i = list.searchGroups.push({ searchFields: searchGroup.searchField })

			for (const searchField of list.searchGroups[i - 1].searchFields) {
				if (searchField.sortByOrder) searchField.sortByOrder = parseInt(searchField.sortByOrder + '', 10)
			}
		}

		return list
	}
}
export namespace XMLObjectPaths {
	export function fromXML(xml: AnyXMLObject): IMOSObjectPath[] {
		if (!xml) return []
		const getType = (xml: AnyXMLObject) => {
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
		const getDescription = (xml: AnyXMLObject) => {
			return xml.techDescription || (xml.attributes ? xml.attributes.techDescription : '')
		}
		const getTarget = (xml: AnyXMLObject) => {
			if (has(xml, 'objPath')) {
				return xml.objPath
			} else if (has(xml, 'objProxyPath')) {
				return xml.objProxyPath
			} else if (has(xml, 'objMetadataPath')) {
				return xml.objMetadataPath
			} else {
				return xml.text || xml.$t
			}
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
export namespace XMLMosExternalMetaData {
	export function fromXML(xml: AnyXMLObject): IMOSExternalMetaData[] {
		if (!xml) return []
		let xmlMetadata = xml
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
