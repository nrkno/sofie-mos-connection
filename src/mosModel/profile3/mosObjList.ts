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
		const xmlMosObjList = XMLBuilder.create('mosObjList')
		xmlMosObjList.att('username', this.options.username)

		addTextElement(xmlMosObjList, 'queryID', this.options.queryID)
		addTextElement(xmlMosObjList, 'listReturnStart', this.options.listReturnStart)
		addTextElement(xmlMosObjList, 'listReturnEnd', this.options.listReturnEnd)
		addTextElement(xmlMosObjList, 'listReturnTotal', this.options.listReturnTotal)
		if (this.options.listReturnStatus) addTextElement(xmlMosObjList, 'listReturnStatus', this.options.listReturnStatus)

		if (this.options.list) {
			const xmlList = XMLBuilder.create('list')
			for (const object of this.options.list) {
				xmlList.importDocument(Parser.mosObj2xml(object))
			}
			xmlMosObjList.importDocument(xmlList)
		}

		return xmlMosObjList
	}
}
