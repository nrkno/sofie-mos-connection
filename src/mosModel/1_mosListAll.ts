import { MosTime } from '../dataTypes/mosTime'
import { MosString128 } from '../dataTypes/mosString128'
import { IMOSExternalMetaData } from '../dataTypes/mosExternalMetaData'
import { MosMessage } from '../mosModel/MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { IMOSObject } from '../api'
import { Parser } from './Parser';

export class MosListAll extends MosMessage {

	objs: Array<IMOSObject>

  /** */
	constructor (objs: Array<IMOSObject>) {
		super()
		this.objs = objs
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		let root = XMLBuilder.create('mosListAll')

		this.objs.forEach((obj: IMOSObject) => {
			root.importDocument(Parser.mosObj2xml(obj))
		})

		return root
	}
}
