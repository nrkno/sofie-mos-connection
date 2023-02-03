import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { IMOSListSearchableSchema } from '@mos-connection/model'
import { addTextElementInternal } from '../../utils/Utils'

export class MosListSearchableSchema extends MosMessage {
	private options: IMOSListSearchableSchema

	constructor(options: IMOSListSearchableSchema, strict: boolean) {
		super('query', strict)
		this.options = options
	}

	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const xml = XMLBuilder.create('mosListSearchableSchema')
		xml.att('username', this.options.username)

		addTextElementInternal(xml, 'mosSchema', this.options.mosSchema, undefined, this.strict)

		return xml
	}
}
