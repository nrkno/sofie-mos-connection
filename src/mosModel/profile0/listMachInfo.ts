import { MosTime } from '../../dataTypes/mosTime'
import { MosString128 } from '../../dataTypes/mosString128'
import { IMOSExternalMetaData } from '../../dataTypes/mosExternalMetaData'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { addTextElement } from '../../utils/Utils'

export enum IMOSListMachInfoDefaultActiveXMode {
	MODALDIALOG = 'MODALDIALOG',
	MODELESS = 'MODELESS',
	CONTAINED = 'CONTAINED',
	TOOLBAR = 'TOOLBAR'
}

export interface IMOSListMachInfo {
	/** Used in MOS ActiveX messages. Manufacturer: Text description. 128 chars max. */
	manufacturer: MosString128
	/** Model: Text description. 128 chars max. */
	model: MosString128
	/** HW Revision: 128 chars max. */
	hwRev: MosString128
	/** Software Revision: (MOS) Text description. 128 chars max., example: '2.1.0.37' */
	swRev: MosString128
	/** Date of Manufacture. */
	DOM: MosTime
	/** Serial Number: text serial number. 128 chars max. ex: '927748927' */
	SN: MosString128
	/** Identification of a Machine: text. 128 chars max. */
	ID: MosString128
	/** Time: Time object changed status. Format is YYYY-MM-DD'T'hh:mm:ss[,ddd]['Z'] */
	time: MosTime
	/** Operational Time: date and time of last machine start. Format is YYYY-MM-DD'T'hh:mm:ss[,ddd]['Z'] */
	opTime?: MosTime
	/** MOS Revision: Text description. 128 chars max. */
	mosRev: MosString128

	supportedProfiles: {
		deviceType: 'NCS' | 'MOS',
		profile0?: boolean,
		profile1?: boolean,
		profile2?: boolean,
		profile3?: boolean,
		profile4?: boolean,
		profile5?: boolean,
		profile6?: boolean,
		profile7?: boolean

	}
	/** defaultActiveX contains tags that describe the correct settings for the ActiveX control (NOTE: no two <defaultActivX> elements can have the same <mode> value). */
	defaultActiveX?: Array<IMOSDefaultActiveX>
	mosExternalMetaData?: Array<IMOSExternalMetaData>
}
export interface IMOSDefaultActiveX {
	/** Used in MOS ActiveX messages. How the ActiveX Plug-In window appears in the NCS Host window: MODALDIALOG, MODELESS, CONTAINED, TOOLBAR. */
	mode: IMOSListMachInfoDefaultActiveXMode
	/** controlFileLocation is the file location for the default ActiveX control. */
	controlFileLocation: string
	/** Defined by MOS 128 characters max */
	controlSlug: MosString128
	/** This value represents the key/classid key used to load the ActiveX from the registry., ex: "contained.containedCTRL.1" */
	controlName: string
	/** This value represents the parameters that can be passed to an ActiveX. ex "URL=http:" */
	controlDefaultParams: string
}

export class ListMachineInfo extends MosMessage {

	info: IMOSListMachInfo

  /** */
	constructor (info: IMOSListMachInfo, port: 'upper' | 'lower') {
		super(port)
		this.info = info
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElement {

		let xmlListMachInfo = XMLBuilder.create('listMachInfo')
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
			addTextElement(xmlSupportedProfiles, 'mosProfile', ((this as any).info.supportedProfiles['profile' + i] ? 'YES' : 'NO')).att('number', i)
		}
		xmlListMachInfo.importDocument(xmlSupportedProfiles)
		return xmlListMachInfo
	}
}
