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
		const xmlMosReqObjList = XMLBuilder.create('mosReqObjList')
		xmlMosReqObjList.att('username', this.options.username)

		addTextElement(xmlMosReqObjList, 'username', this.options.username)
		addTextElement(xmlMosReqObjList, 'queryID', this.options.queryID)
		addTextElement(xmlMosReqObjList, 'listReturnStart', this.options.listReturnStart)
		addTextElement(xmlMosReqObjList, 'listReturnEnd', this.options.listReturnEnd)
		addTextElement(xmlMosReqObjList, 'generalSearch', this.options.generalSearch)
		addTextElement(xmlMosReqObjList, 'mosSchema', this.options.mosSchema)

		for (const searchGroup of this.options.searchGroups) {
			const xmlSearchGroup = XMLBuilder.create('searchGroup')
			for (const searchField of searchGroup.searchFields) {

				const attributes: {[key: string]: string} = {}
				Object.keys(searchField).forEach(key => {
					// @ts-ignore
					attributes[key] = searchField[key] + ''
				})
				addTextElement(xmlSearchGroup, 'searchField', '', attributes)
			}
			xmlMosReqObjList.importDocument(xmlSearchGroup)
		}

		return xmlMosReqObjList
	}
}
