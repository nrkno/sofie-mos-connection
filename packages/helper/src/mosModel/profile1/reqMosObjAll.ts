import * as XMLBuilder from 'xmlbuilder'
import { addTextElementInternal } from '../../utils/Utils'
import { MosMessage } from '../MosMessage'

export class ReqMosObjAll extends MosMessage {
	private pause: number
	/** */
	constructor(pause: number, strict: boolean) {
		super('lower', strict)
		this.pause = pause
	}

	/** */
	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const root = XMLBuilder.create('mosReqAll')
		addTextElementInternal(root, 'pause', this.pause + '', undefined, this.strict)
		return root
	}
}
