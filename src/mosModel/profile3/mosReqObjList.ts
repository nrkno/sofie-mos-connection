import { IMosRequestObjectList } from '../../api'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'

export class MosReqObjList extends MosMessage {
	private options: IMosRequestObjectList

	constructor (options: IMosRequestObjectList) {
		super()
		this.options = options
		this.port = 'query'
	}

	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
		const xml = XMLBuilder.create('mosReqObjList')
		xml.att('username', this.options.username)

		xml.ele('username', {}, this.options.username)
		xml.ele('queryID', {}, this.options.queryID)
		xml.ele('listReturnStart', {}, this.options.listReturnStart)
		xml.ele('listReturnEnd', {}, this.options.listReturnEnd)
		xml.ele('generalSearch', {}, this.options.generalSearch)
		xml.ele('mosSchema', {}, this.options.mosSchema)

		for (const searchGroup of this.options.searchGroups) {
			const groupEle = xml.ele('searchGroup')
			for (const searchField of searchGroup.searchFields) {
				groupEle.ele('searchField', searchField)
			}
		}

		return xml
	}
}
