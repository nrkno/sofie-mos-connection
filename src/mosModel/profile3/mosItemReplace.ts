import { MosItemReplaceOptions } from '../../api'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { addTextElement } from '../../utils/Utils'
import { XMLMosItem } from '../profile2/xmlConversion'

export class MosItemReplace extends MosMessage {
	private options: MosItemReplaceOptions

	constructor (options: MosItemReplaceOptions) {
		super('upper')
		this.options = options
	}

	get messageXMLBlocks (): XMLBuilder.XMLElement {
		const item = this.options.item
		const root = XMLBuilder.create('mosItemReplace')

		addTextElement(root, 'roID', this.options.roID)
		addTextElement(root, 'storyID', this.options.storyID)

		XMLMosItem.toXML(root, item)

		return root
	}
}
