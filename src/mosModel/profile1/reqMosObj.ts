import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { MosString128 } from '../../dataTypes/mosString128'
import { addTextElement } from '../../utils/Utils'

export class ReqMosObj extends MosMessage {

	private objId: MosString128
  /** */
	constructor (objId: MosString128) {
		super('lower')
		this.objId = objId
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let root = XMLBuilder.create('mosReqObj')
		addTextElement(root, 'objID', this.objId)
		return root
	}
}
