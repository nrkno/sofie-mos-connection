import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from './MosMessage'

export class ReqMosObjAll extends MosMessage {

	private pause: number
  /** */
	constructor (pause: number = 0) {
		super()
		this.pause = pause
		this.port = 'lower'
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		let root = XMLBuilder.create('mosReqAll')
		root.ele('pause', {}, this.pause + '')
		return root
	}
}
