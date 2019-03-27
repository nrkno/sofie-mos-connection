import { IMOSItem } from '../../api'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { Parser } from '../Parser'
import { MosString128 } from '../../dataTypes/mosString128'

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

	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		const item = this.options.item
		const root = XMLBuilder.create('mosItemReplace')

		root.ele('roID', {}, this.options.roID)
		root.ele('storyID', {}, this.options.storyID)
		root.importDocument(Parser.item2xml(item))

		return root
	}
}
