import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'

export class MosReqSearchableSchema extends MosMessage {
	private options: { username: string }

	constructor (options: { username: string }) {
		super()
		this.options = options
		this.port = 'query'
	}

	get messageXMLBlocks (): XMLBuilder.XMLElement {
		const xml = XMLBuilder.create('mosReqSearchableSchema')
		xml.att('username', this.options.username)

		return xml
	}
}
