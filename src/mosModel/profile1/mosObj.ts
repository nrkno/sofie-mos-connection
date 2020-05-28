import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { IMOSObject } from '../../api'
import { XMLMosObject } from './xmlConversion'

export class MosObj extends MosMessage {

	obj: IMOSObject

  /** */
	constructor (obj: IMOSObject) {
		super()
		this.obj = obj
		this.port = 'lower'
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let xmlMosObj = XMLBuilder.create('mosObj')
		XMLMosObject.toXML(xmlMosObj, this.obj)

		return xmlMosObj
	}
}
