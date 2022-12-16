import { IMOSListMachInfo } from '@mos-connection/model'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { addTextElementInternal } from '../../utils/Utils'

export class ListMachineInfo extends MosMessage {
	info: IMOSListMachInfo

	/** */
	constructor(info: IMOSListMachInfo, port: 'upper' | 'lower', strict: boolean) {
		super(port, strict)
		this.info = info
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const xmlListMachInfo = XMLBuilder.create('listMachInfo')
		addTextElementInternal(xmlListMachInfo, 'manufacturer', this.info.manufacturer, undefined, this.strict)
		addTextElementInternal(xmlListMachInfo, 'model', this.info.model, undefined, this.strict)
		addTextElementInternal(xmlListMachInfo, 'hwRev', this.info.hwRev, undefined, this.strict)
		addTextElementInternal(xmlListMachInfo, 'swRev', this.info.swRev, undefined, this.strict)
		addTextElementInternal(xmlListMachInfo, 'DOM', this.info.DOM, undefined, this.strict)
		addTextElementInternal(xmlListMachInfo, 'SN', this.info.SN, undefined, this.strict)
		addTextElementInternal(xmlListMachInfo, 'ID', this.info.ID, undefined, this.strict)
		addTextElementInternal(xmlListMachInfo, 'time', this.info.time, undefined, this.strict)
		if (this.info.opTime)
			addTextElementInternal(xmlListMachInfo, 'opTime', this.info.opTime, undefined, this.strict)
		addTextElementInternal(xmlListMachInfo, 'mosRev', this.info.mosRev, undefined, this.strict)

		// TODO: the supportedProfiles should be changed to an Array

		const xmlSupportedProfiles = XMLBuilder.create('supportedProfiles')
		xmlSupportedProfiles.att('deviceType', this.info.supportedProfiles.deviceType)
		// let p = addTextElement(root, 'supportedProfiles').att('deviceType', this.info.supportedProfiles.deviceType)
		for (let i = 0; i < 8; i++) {
			addTextElementInternal(
				xmlSupportedProfiles,
				'mosProfile',
				(this as any).info.supportedProfiles['profile' + i] ? 'YES' : 'NO',
				undefined,
				this.strict
			).att('number', i)
		}
		xmlListMachInfo.importDocument(xmlSupportedProfiles)
		return xmlListMachInfo
	}
}
