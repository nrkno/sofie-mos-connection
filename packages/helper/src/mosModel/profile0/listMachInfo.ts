import { IMOSListMachInfo } from '@mos-connection/model'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { addTextElement } from '../../utils/Utils'

export class ListMachineInfo extends MosMessage {
	info: IMOSListMachInfo

	/** */
	constructor(info: IMOSListMachInfo, port: 'upper' | 'lower') {
		super(port)
		this.info = info
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const xmlListMachInfo = XMLBuilder.create('listMachInfo')
		addTextElement(xmlListMachInfo, 'manufacturer', this.info.manufacturer)
		addTextElement(xmlListMachInfo, 'model', this.info.model)
		addTextElement(xmlListMachInfo, 'hwRev', this.info.hwRev)
		addTextElement(xmlListMachInfo, 'swRev', this.info.swRev)
		addTextElement(xmlListMachInfo, 'DOM', this.info.DOM)
		addTextElement(xmlListMachInfo, 'SN', this.info.SN)
		addTextElement(xmlListMachInfo, 'ID', this.info.ID)
		addTextElement(xmlListMachInfo, 'time', this.info.time)
		if (this.info.opTime) addTextElement(xmlListMachInfo, 'opTime', this.info.opTime)
		addTextElement(xmlListMachInfo, 'mosRev', this.info.mosRev)

		// TODO: the supportedProfiles should be changed to an Array

		const xmlSupportedProfiles = XMLBuilder.create('supportedProfiles')
		xmlSupportedProfiles.att('deviceType', this.info.supportedProfiles.deviceType)
		// let p = addTextElement(root, 'supportedProfiles').att('deviceType', this.info.supportedProfiles.deviceType)
		for (let i = 0; i < 8; i++) {
			addTextElement(
				xmlSupportedProfiles,
				'mosProfile',
				(this as any).info.supportedProfiles['profile' + i] ? 'YES' : 'NO'
			).att('number', i)
		}
		xmlListMachInfo.importDocument(xmlSupportedProfiles)
		return xmlListMachInfo
	}
}
