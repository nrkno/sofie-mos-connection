import { IMosObjectList } from '../../api'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { Parser } from '../Parser'

export class MosObjList extends MosMessage {
	private options: IMosObjectList

	constructor (options: IMosObjectList) {
		super()
		this.options = options
		this.port = 'upper'
	}

	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		const xml = XMLBuilder.create('mosObjList')
		xml.att('username', this.options.username)

		xml.ele('queryID', {}, this.options.queryID)
		xml.ele('listReturnStart', {}, this.options.listReturnStart)
		xml.ele('listReturnEnd', {}, this.options.listReturnEnd)
		xml.ele('listReturnTotal', {}, this.options.listReturnTotal)
		if (this.options.listReturnStatus) xml.ele('listReturnStatus', {}, this.options.listReturnStatus)

		if (this.options.list) {
			const listEl = xml.ele('list')
			for (const object of this.options.list) {
				listEl.importDocument(Parser.mosObj2xml(object))
			}
		}

		return xml
	}
}
