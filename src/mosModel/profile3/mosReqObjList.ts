import { IMosRequestObjectList } from '../../api'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { addTextElement } from '../../utils/Utils'

export class MosReqObjList extends MosMessage {
	private options: IMosRequestObjectList

	constructor (options: IMosRequestObjectList) {
		super()
		this.options = options
		this.port = 'query'
	}

	get messageXMLBlocks (): XMLBuilder.XMLElement {
		const xml = XMLBuilder.create('mosReqObjList')
		xml.att('username', this.options.username)

		addTextElement(xml, 'username', {}, this.options.username)
		addTextElement(xml, 'queryID', {}, this.options.queryID)
		addTextElement(xml, 'listReturnStart', {}, this.options.listReturnStart)
		addTextElement(xml, 'listReturnEnd', {}, this.options.listReturnEnd)
		addTextElement(xml, 'generalSearch', {}, this.options.generalSearch)
		addTextElement(xml, 'mosSchema', {}, this.options.mosSchema)

		for (const searchGroup of this.options.searchGroups) {
			const groupEle = addTextElement(xml, 'searchGroup')
			for (const searchField of searchGroup.searchFields) {
				addTextElement(groupEle, 'searchField', searchField)
			}
		}

		return xml
	}
}
