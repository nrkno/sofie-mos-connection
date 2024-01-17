import * as XMLBuilder from 'xmlbuilder'
import { IMOSRequestObjectList, IMOSObject, IMOSAck, IMOSAckStatus } from '@mos-connection/model'
import { XMLObjectPaths, XMLMosExternalMetaData } from '../profile2/xmlConversion'
import { AnyXML, has } from '../lib'
import { addTextElementInternal } from '../../utils/Utils'
import { getParseMosTypes } from '../parseMosTypes'

/* eslint-disable @typescript-eslint/no-namespace */
export namespace XMLMosAck {
	export function fromXML(xml: AnyXML, strict: boolean): IMOSAck {
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
	export function fromXML(xml: AnyXML, strict: boolean): Array<IMOSObject> {
		if (!xml) return []
		let xmlObjs: Array<any> = xml as any
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
	export function fromXML(xml: AnyXML, strict: boolean): IMOSObject {
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
	export function fromXML(xml: AnyXML): IMOSRequestObjectList {
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
