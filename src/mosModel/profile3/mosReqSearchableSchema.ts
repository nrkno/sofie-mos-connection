import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'

export class MosReqSearchableSchema extends MosMessage {
	private options: { username: string }

	constructor (options: { username: string }) {
		super()
		this.options = options
		this.port = 'query'
	}

	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		const xml = XMLBuilder.create('mosReqSearchableOptions', {
			username: this.options.username
		})

		return xml
	}
}
