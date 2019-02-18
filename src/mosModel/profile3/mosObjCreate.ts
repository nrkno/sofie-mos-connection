import { IMOSObject } from '../../api'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { Parser } from '../Parser'

export class MosObjCreatee extends MosMessage {
	private object: IMOSObject

	constructor (object: IMOSObject) {
		super()
		this.object = object
		this.port = 'lower'
	}

	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		let xml = XMLBuilder.create('mosObjCreate')

		Parser.attachMosObj2xml(this.object, xml)

		return xml
	}
}
