import { IMOSItem } from '../../api'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { Parser } from '../Parser'
import { MosString128 } from '../../dataTypes/mosString128'
import { addTextElement } from '../../utils/Utils'

export interface MosItemReplaceOptions {
	roID: MosString128
	storyID: MosString128
	item: IMOSItem
}

export class MosItemReplace extends MosMessage {
	private options: MosItemReplaceOptions

	constructor (options: MosItemReplaceOptions) {
		super()
		this.options = options
		this.port = 'upper'
	}

	get messageXMLBlocks (): XMLBuilder.XMLElement {
		const item = this.options.item
		const root = XMLBuilder.create('mosItemReplace')

		addTextElement(root, 'roID', this.options.roID)
		addTextElement(root, 'storyID', this.options.storyID)
		root.importDocument(Parser.item2xml(item))

		return root
	}
}
