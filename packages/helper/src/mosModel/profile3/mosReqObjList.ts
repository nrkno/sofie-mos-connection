import { IMOSRequestObjectList } from '@mos-connection/model'
import { MosMessage } from '../MosMessage'
import * as XMLBuilder from 'xmlbuilder'
import { addTextElementInternal } from '../../utils/Utils'

export class MosReqObjList extends MosMessage {
	private options: IMOSRequestObjectList

	constructor(options: IMOSRequestObjectList, strict: boolean) {
		super('query', strict)
		this.options = options
	}

	get messageXMLBlocks(): XMLBuilder.XMLElement {
		const xmlMosReqObjList = XMLBuilder.create('mosReqObjList')
		xmlMosReqObjList.att('username', this.options.username)

		addTextElementInternal(xmlMosReqObjList, 'username', this.options.username, undefined, this.strict)
		addTextElementInternal(xmlMosReqObjList, 'queryID', this.options.queryID, undefined, this.strict)
		addTextElementInternal(
			xmlMosReqObjList,
			'listReturnStart',
			this.options.listReturnStart,
			undefined,
			this.strict
		)
		addTextElementInternal(xmlMosReqObjList, 'listReturnEnd', this.options.listReturnEnd, undefined, this.strict)
		addTextElementInternal(xmlMosReqObjList, 'generalSearch', this.options.generalSearch, undefined, this.strict)
		addTextElementInternal(xmlMosReqObjList, 'mosSchema', this.options.mosSchema, undefined, this.strict)

		for (const searchGroup of this.options.searchGroups) {
			const xmlSearchGroup = XMLBuilder.create('searchGroup')
			for (const searchField of searchGroup.searchFields) {
				const attributes: { [key: string]: string } = {}
				Object.entries<any>(searchField).forEach(([key, value]) => {
					attributes[key] = value + ''
				})
				addTextElementInternal(xmlSearchGroup, 'searchField', '', attributes, this.strict)
			}
			xmlMosReqObjList.importDocument(xmlSearchGroup)
		}

		return xmlMosReqObjList
	}
}
