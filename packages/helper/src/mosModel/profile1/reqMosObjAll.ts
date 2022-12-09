import * as XMLBuilder from 'xmlbuilder'
import { addTextElement } from '../../utils/Utils'
import { MosMessage } from '../MosMessage'

export class ReqMosObjAll extends MosMessage {
	private pause: number
	/** */
	constructor(pause = 0) {
		super('lower')
		this.pause = pause
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('mosReqAll')
		addTextElement(root, 'pause', this.pause + '')
		return root
	}
}
