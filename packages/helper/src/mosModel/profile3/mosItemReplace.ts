import { MosItemReplaceOptions } from '@mos-connection/model'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { XMLMosItem } from '../profile2/xmlConversion'
import { addTextElementInternal } from '../../utils/Utils'

export class MosItemReplace extends MosMessage {
	private options: MosItemReplaceOptions

	constructor(options: MosItemReplaceOptions, strict: boolean) {
		super('upper', strict)
		this.options = options
	}

	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const item = this.options.item
		const root = XMLBuilder.create('mosItemReplace')

		addTextElementInternal(root, 'roID', this.options.roID, undefined, this.strict)
		addTextElementInternal(root, 'storyID', this.options.storyID, undefined, this.strict)

		XMLMosItem.toXML(root, item, this.strict)

		return root
	}
}
