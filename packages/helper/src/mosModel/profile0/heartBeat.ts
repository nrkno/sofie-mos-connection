import { getMosTypes, IMOSTime } from '@mos-connection/model'
import * as XMLBuilder from 'xmlbuilder'

import { addTextElementInternal } from '../../utils/Utils'
import { MosMessage, PortType } from '../MosMessage'

export class HeartBeat extends MosMessage {
	time: IMOSTime

	/** */
	constructor(port: PortType, time: IMOSTime | undefined, strict: boolean) {
		super(port, strict)
		if (!time) time = getMosTypes(true).mosTime.create(undefined)
		this.time = time
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const heartbeat = XMLBuilder.create('heartbeat')
		addTextElementInternal(heartbeat, 'time', this.time, undefined, this.strict)
		return heartbeat
	}
}
