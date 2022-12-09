import { IMOSObjectList } from '@mos-connection/model'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { XMLMosObjects } from '../profile1/xmlConversion'
import { addTextElement } from '../../utils/Utils'

export class MosObjList extends MosMessage {
	private options: IMOSObjectList

	constructor(options: IMOSObjectList) {
		super('upper')
		this.options = options
	}

	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const xmlMosObjList = XMLBuilder.create('mosObjList')
		xmlMosObjList.att('username', this.options.username)

		addTextElement(xmlMosObjList, 'queryID', this.options.queryID)
		addTextElement(xmlMosObjList, 'listReturnStart', this.options.listReturnStart)
		addTextElement(xmlMosObjList, 'listReturnEnd', this.options.listReturnEnd)
		addTextElement(xmlMosObjList, 'listReturnTotal', this.options.listReturnTotal)
		if (this.options.listReturnStatus)
			addTextElement(xmlMosObjList, 'listReturnStatus', this.options.listReturnStatus)

		if (this.options.list) {
			const xmlList = XMLBuilder.create('list')
			XMLMosObjects.toXML(xmlList, this.options.list)

			xmlMosObjList.importDocument(xmlList)
		}

		return xmlMosObjList
	}
}
