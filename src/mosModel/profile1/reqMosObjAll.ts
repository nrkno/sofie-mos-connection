import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { addTextElement } from '../../utils/Utils'

export class ReqMosObjAll extends MosMessage {

	private pause: number
  /** */
	constructor (pause: number = 0) {
		super('lower')
		this.pause = pause
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let root = XMLBuilder.create('mosReqAll')
		addTextElement(root, 'pause', this.pause + '')
		return root
	}
}
