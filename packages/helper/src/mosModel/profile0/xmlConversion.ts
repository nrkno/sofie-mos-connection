import * as XMLBuilder from 'xmlbuilder'
import { IMOSListMachInfo, IMOSString128 } from '@mos-connection/model'
import { AnyXML, getHandleError } from '../lib'
import { addTextElementInternal } from '../../utils/Utils'
import { getParseMosTypes, parseOptional } from '../parseMosTypes'

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
		const { mosString128, mosTime } = getParseMosTypes(strict)

		const handleError = getHandleError('listMachInfo')

		const list: IMOSListMachInfo = {
			manufacturer: handleError(mosString128.createRequired, xml.manufacturer, 'manufacturer'),
			model: handleError(mosString128.createRequired, xml.model, 'model'),
			hwRev: handleError(mosString128.createRequired, xml.hwRev, 'hwRev'),
			swRev: handleError(mosString128.createRequired, xml.swRev, 'swRev'),
			DOM: handleError(mosString128.createRequired, xml.DOM, 'DOM'),
			SN: handleError(mosString128.createRequired, xml.SN, 'SN'),
			ID: handleError(mosString128.createRequired, xml.ID, 'ID'),
			time: handleError(mosTime.createRequired, xml.time, 'time'),
			opTime: handleError(mosTime.createOptional, xml.opTime, 'opTime'),
			mosRev: handleError(mosString128.createRequired, xml.mosRev, 'mosRev'),
			supportedProfiles: handleError(
				(v) => parseSupportedProfiles(v, strict),
				xml.supportedProfiles,
				'supportedProfiles'
			),
			defaultActiveX: handleError(
				parseOptional((v) => v),
				xml.defaultActiveX,
				'defaultActiveX'
			),
			mosExternalMetaData: handleError((v) => v, xml.mosExternalMetaData, 'mosExternalMetaData'),
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

function parseSupportedProfiles(xmlSupportedProfiles: any, strict: boolean): IMOSListMachInfo['supportedProfiles'] {
	const parsed: IMOSListMachInfo['supportedProfiles'] = {
		deviceType: xmlSupportedProfiles?.deviceType ?? 'N/A',
		// Note: .profiles are added below
	}

	if (strict) {
		if (!['NCS', 'MOS'].includes(parsed.deviceType)) {
			throw new Error(`Invalid supportedProfiles.deviceType: "${parsed.deviceType}"`)
		}
	}

	if (Array.isArray(xmlSupportedProfiles.mosProfile)) {
		for (const mosProfile of xmlSupportedProfiles.mosProfile) {
			// @ts-expect-error hack
			parsed[`profile${mosProfile.attributes.number}`] = mosProfile.text === 'YES'
		}
	}

	return parsed
}
