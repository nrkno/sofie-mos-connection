import { IMosObjectList } from '../../api'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { Parser } from '../Parser'
import { addTextElement } from '../../utils/Utils'

export class MosObjList extends MosMessage {
	private options: IMosObjectList

	constructor (options: IMosObjectList) {
		super()
		this.options = options
		this.port = 'upper'
	}

	get messageXMLBlocks (): XMLBuilder.XMLElement {
		const xml = XMLBuilder.create('mosObjList')
		xml.att('username', this.options.username)

		addTextElement(xml, 'queryID', {}, this.options.queryID)
		addTextElement(xml, 'listReturnStart', {}, this.options.listReturnStart)
		addTextElement(xml, 'listReturnEnd', {}, this.options.listReturnEnd)
		addTextElement(xml, 'listReturnTotal', {}, this.options.listReturnTotal)
		if (this.options.listReturnStatus) addTextElement(xml, 'listReturnStatus', {}, this.options.listReturnStatus)

		if (this.options.list) {
			const listEl = addTextElement(xml, 'list')
			for (const object of this.options.list) {
				listEl.importDocument(Parser.mosObj2xml(object))
			}
		}

		return xml
	}
}
