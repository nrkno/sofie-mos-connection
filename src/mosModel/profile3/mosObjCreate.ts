import { IMOSObject } from '../../api'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { XMLMosObject } from '../profile1/xmlConversion'

// http://mosprotocol.com/wp-content/MOS-Protocol-Documents/MOS-Protocol-2.8.4-Current.htm#mosObjCreate
export class MosObjCreate extends MosMessage {
	private object: IMOSObject

	constructor(object: IMOSObject) {
		super('lower')
		this.object = object
	}

	get messageXMLBlocks(): XMLBuilder.XMLElement {
		let xml = XMLBuilder.create('mosObjCreate')

		XMLMosObject.toXML(xml, this.object)

		return xml
	}
}
