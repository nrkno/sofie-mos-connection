import * as XMLBuilder from 'xmlbuilder'
import { MosTime } from './../dataTypes/mosTime'
import { MosMessage } from './MosMessage'

export class HeartBeat extends MosMessage {

	time: MosTime

  /** */
	constructor (time: MosTime = new MosTime()) {
		super()
		this.time = time
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		let messageBlock = XMLBuilder.create('heartbeat')
		.element('time', {}, this.time.toString())
		return messageBlock
	}
}
