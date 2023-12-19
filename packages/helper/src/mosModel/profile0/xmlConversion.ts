import * as XMLBuilder from 'xmlbuilder'
import { IMOSListMachInfo, IMOSString128 } from '@mos-connection/model'
import { AnyXML } from '../lib'
import { addTextElementInternal } from '../../utils/Utils'
import { getParseMosTypes } from '../parseMosTypes'

/* eslint-disable @typescript-eslint/no-namespace */
export namespace XMLMosIDs {
	export function fromXML(xml: AnyXML, strict: boolean): IMOSString128[] {
		const mosTypes = getParseMosTypes(strict)

		const arr: Array<IMOSString128> = []
		let xmlIds: Array<string> = xml as any
		if (!Array.isArray(xmlIds)) xmlIds = [xmlIds]
		xmlIds.forEach((id: string) => {
			arr.push(mosTypes.mosString128.createRequired(id))
		})

		return arr
	}
}

/* eslint-disable @typescript-eslint/no-namespace */
export namespace XMLMosListMachInfo {
	export function fromXML(xml: AnyXML, strict: boolean): IMOSListMachInfo {
		const mosTypes = getParseMosTypes(strict)

		const list: IMOSListMachInfo = {
			manufacturer: mosTypes.mosString128.createRequired(xml.manufacturer),
			model: mosTypes.mosString128.createRequired(xml.model),
			hwRev: mosTypes.mosString128.createRequired(xml.hwRev),
			swRev: mosTypes.mosString128.createRequired(xml.swRev),
			DOM: mosTypes.mosString128.createRequired(xml.DOM),
			SN: mosTypes.mosString128.createRequired(xml.SN),
			ID: mosTypes.mosString128.createRequired(xml.ID),
			time: mosTypes.mosTime.createRequired(xml.time),
			opTime: mosTypes.mosTime.createOptional(xml.opTime),
			mosRev: mosTypes.mosString128.createRequired(xml.mosRev),
			supportedProfiles: {
				deviceType: xml.supportedProfiles?.deviceType ?? 'N/A',
				// Note: .profiles are added below
			},
			defaultActiveX: xml.defaultActiveX,
			mosExternalMetaData: xml.mosExternalMetaData,
		}
		if (strict) {
			if (!['NCS', 'MOS'].includes(list.supportedProfiles.deviceType)) {
				throw new Error(`Invalid supportedProfiles.deviceType: "${list.supportedProfiles.deviceType}"`)
			}
		}

		if (Array.isArray(xml.supportedProfiles.mosProfile)) {
			for (const mosProfile of xml.supportedProfiles.mosProfile) {
				// @ts-expect-error hack
				list.supportedProfiles[`profile${mosProfile.attributes.number}`] = mosProfile.text === 'YES'
			}
		}

		return list
	}
	export function toXML(xmlListMachInfo: XMLBuilder.XMLElement, info: IMOSListMachInfo, strict: boolean): void {
		addTextElementInternal(xmlListMachInfo, 'manufacturer', info.manufacturer, undefined, strict)
		addTextElementInternal(xmlListMachInfo, 'model', info.model, undefined, strict)
		addTextElementInternal(xmlListMachInfo, 'hwRev', info.hwRev, undefined, strict)
		addTextElementInternal(xmlListMachInfo, 'swRev', info.swRev, undefined, strict)
		addTextElementInternal(xmlListMachInfo, 'DOM', info.DOM, undefined, strict)
		addTextElementInternal(xmlListMachInfo, 'SN', info.SN, undefined, strict)
		addTextElementInternal(xmlListMachInfo, 'ID', info.ID, undefined, strict)
		addTextElementInternal(xmlListMachInfo, 'time', info.time, undefined, strict)
		if (info.opTime) addTextElementInternal(xmlListMachInfo, 'opTime', info.opTime, undefined, strict)
		addTextElementInternal(xmlListMachInfo, 'mosRev', info.mosRev, undefined, strict)

		// TODO: the supportedProfiles should be changed to an Array

		const xmlSupportedProfiles = XMLBuilder.create('supportedProfiles')
		xmlSupportedProfiles.att('deviceType', info.supportedProfiles.deviceType)
		// let p = addTextElement(root, 'supportedProfiles').att('deviceType', info.supportedProfiles.deviceType)
		for (let i = 0; i < 8; i++) {
			addTextElementInternal(
				xmlSupportedProfiles,
				'mosProfile',
				(info.supportedProfiles as any)['profile' + i] ? 'YES' : 'NO',
				undefined,
				strict
			).att('number', i)
		}
		xmlListMachInfo.importDocument(xmlSupportedProfiles)
	}
}
