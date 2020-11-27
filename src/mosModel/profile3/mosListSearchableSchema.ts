import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { IMOSSearchableSchema } from '../../api'
import { addTextElement } from '../../utils/Utils'

export class MosListSearchableSchema extends MosMessage {
	private options: IMOSSearchableSchema

	constructor (options: IMOSSearchableSchema) {
		super('query')
		this.options = options
	}

	get messageXMLBlocks (): XMLBuilder.XMLElement {
		const xml = XMLBuilder.create('mosListSearchableSchema')
		xml.att('username', this.options.username)

		addTextElement(xml, 'mosSchema', this.options.mosSchema)

		return xml
	}
}
