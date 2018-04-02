import * as XMLBuilder from 'xmlbuilder'
import {MosMessage} from './MosMessage'

export class ReqMachInfo extends MosMessage {

  /** */
	constructor () {
		super()
	}

  /** */
	get messageXMLBlocks(): XMLBuilder.XMLElementOrXMLNode {
		let messageBlock = XMLBuilder.create('reqMachInfo')
		return messageBlock
	}
}

