import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { IMOSObject } from '../../api'
import { XMLMosObject } from '../profile1/xmlConversion'

export class MosListAll extends MosMessage {
	objs: Array<IMOSObject>

	/** */
	constructor(objs: Array<IMOSObject>) {
		super('lower')
		this.objs = objs
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		let root = XMLBuilder.create('mosListAll')

		this.objs.forEach((obj: IMOSObject) => {
			let xmlMosObj = XMLBuilder.create('mosObj')
			XMLMosObject.toXML(xmlMosObj, obj)
			root.importDocument(xmlMosObj)
		})

		return root
	}
}
