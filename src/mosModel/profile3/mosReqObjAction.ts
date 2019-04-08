import { IMOSObject } from '../../api'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { Parser } from '../Parser'

export interface MosReqObjActionOptions {
	object: IMOSObject
	action: 'NEW' | 'UPDATE' | 'DELETE'
}

export class MosReqObjAction extends MosMessage {
	private options: MosReqObjActionOptions

	constructor (options: MosReqObjActionOptions) {
		super()
		this.options = options
		this.port = 'lower'
	}

	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		const xml = XMLBuilder.create('mosReqObjAction')
		xml.att('operation', this.options.action)
		if (this.options.action !== 'NEW') xml.att('objID', this.options.object.ID)

		Parser.attachMosObj2xml(this.options.object, xml)

		return xml
	}
}
