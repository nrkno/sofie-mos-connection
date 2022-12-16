import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'

export class ReqMachInfo extends MosMessage {
	/** */
	constructor(strict: boolean) {
		super('lower', strict)
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const messageBlock = XMLBuilder.create('reqMachInfo')
		return messageBlock
	}
}
