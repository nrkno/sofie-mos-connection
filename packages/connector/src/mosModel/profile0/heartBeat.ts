import * as XMLBuilder from 'xmlbuilder'
import { MosTime } from '../../dataTypes/mosTime'
import { MosMessage, PortType } from '../MosMessage'
import { addTextElement } from '../../utils/Utils'

export class HeartBeat extends MosMessage {
	time: MosTime

	/** */
	constructor(port: PortType, time: MosTime = new MosTime()) {
		super(port)
		this.time = time
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const heartbeat = XMLBuilder.create('heartbeat')
		addTextElement(heartbeat, 'time', this.time)
		return heartbeat
	}
}
