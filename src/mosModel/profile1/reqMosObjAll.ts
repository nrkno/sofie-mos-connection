import * as XMLBuilder from 'xmlbuilder'
import { MosMessage } from '../MosMessage'
import { addTextElement } from '../../utils/Utils'

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
