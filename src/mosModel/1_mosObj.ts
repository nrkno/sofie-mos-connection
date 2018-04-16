import { MosTime } from '../dataTypes/mosTime'
import { MosString128 } from '../dataTypes/mosString128'
import { IMOSExternalMetaData } from '../dataTypes/mosExternalMetaData'
import { MosMessage } from '../mosModel/MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { IMOSObject } from '../api'
import { Parser } from './Parser';

export class MosObj extends MosMessage {

	obj: IMOSObject

  /** */
	constructor (obj: IMOSObject) {
		super()
		this.obj = obj
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		return Parser.mosObj2xml(this.obj)
	}
}
