import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { MosString128 } from '../../dataTypes/mosString128'

export class ReqMosObj extends MosMessage {

	private objId: MosString128
  /** */
	constructor (objId: MosString128) {
		super()
		this.port = 'lower'
		this.objId = objId
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let root = XMLBuilder.create('mosReqObj')
		root.ele('objID', {}, this.objId.toString())
		return root
	}
}
