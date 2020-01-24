import * as XMLBuilder from 'xmlbuilder'
import { MosTime } from '../../dataTypes/mosTime'
import { MosMessage } from '../MosMessage'
import { addTextElement } from '../../utils/Utils'

export class HeartBeat extends MosMessage {

	time: MosTime

  /** */
	constructor (time: MosTime = new MosTime()) {
		super()
		this.time = time
	}

  /** */
	get messageXMLBlocks (): XMLBuilder.XMLElement {
		let messageBlock = addTextElement(XMLBuilder.create('heartbeat'), 'time', {}, this.time)
		return messageBlock
	}
}
