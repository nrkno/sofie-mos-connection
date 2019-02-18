import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { IMOSSearchableSchema } from '../../api'

export class MosListSearchableSchema extends MosMessage {
    private options: IMOSSearchableSchema

    constructor (options: IMOSSearchableSchema) {
        super()
        this.options = options
        this.port = 'query'
    }

    get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
        const xml = XMLBuilder.create('mosListSearchableSchema', {
            username: this.options.username
        })

        xml.ele('mosSchema', {}, this.options.mosSchema)

		return xml
    }
}
